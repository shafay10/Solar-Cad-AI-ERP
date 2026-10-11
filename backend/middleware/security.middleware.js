/**
 * Enterprise Security, Anti-Malware & Confidential Data Protection Middleware
 * Solar ERP Enterprise - Pakistan Market
 */

// 1. Disallowed Dangerous Executable & Script Extensions (Anti-Malware)
const BANNED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".psm1", ".vbs", ".vbe",
  ".js", ".mjs", ".cjs", ".wsf", ".wsh", ".scr", ".pif", ".application",
  ".gadget", ".msi", ".msp", ".com", ".hta", ".cpl", ".msc", ".jar",
  ".php", ".py", ".rb", ".pl", ".cgi", ".asp", ".aspx", ".dll", ".so",
  ".dylib", ".bin", ".iso", ".img", ".dmg"
]);

// 2. Allowed Safe Document & Media MIME Types
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml"
]);

/**
 * Malware Prevention & File Upload Inspector Middleware
 * Validates file names, extensions, base64 payloads, and MIME types.
 */
export const malwareInspectorMiddleware = (req, res, next) => {
  // Inspect request body for uploaded files or base64 payloads
  if (req.body && typeof req.body === "object") {
    const inspectFileProperties = (obj) => {
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "string") {
          // Check for banned file extension patterns
          const lower = val.toLowerCase();
          for (const ext of BANNED_EXTENSIONS) {
            if (lower.endsWith(ext) || lower.includes(`${ext}?`)) {
              return {
                isMalicious: true,
                reason: `MALWARE_BLOCKED: Executable or script file extension '${ext}' is strictly prohibited.`
              };
            }
          }

          // Check for data: URI base64 executable magic headers
          if (lower.startsWith("data:")) {
            if (
              lower.startsWith("data:application/x-msdownload") ||
              lower.startsWith("data:application/x-sh") ||
              lower.startsWith("data:application/x-executable") ||
              lower.startsWith("data:text/javascript") ||
              lower.startsWith("data:application/javascript") ||
              lower.startsWith("data:application/x-php")
            ) {
              return {
                isMalicious: true,
                reason: "MALWARE_BLOCKED: Disallowed executable MIME payload detected in upload."
              };
            }
          }
        } else if (val && typeof val === "object" && !Array.isArray(val)) {
          const nested = inspectFileProperties(val);
          if (nested.isMalicious) return nested;
        }
      }
      return { isMalicious: false };
    };

    const check = inspectFileProperties(req.body);
    if (check.isMalicious) {
      console.warn(`[SECURITY ALERT] Blocked malicious file attempt from IP ${req.ip}: ${check.reason}`);
      return res.status(400).json({ error: check.reason });
    }
  }

  next();
};

/**
 * XSS & Script Injection Neutralizer Middleware
 * Recursively strips dangerous HTML / JavaScript tags from string inputs.
 */
export const inputSanitizerMiddleware = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string") {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === "object") {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

/**
 * Data Loss Prevention (DLP) Response Filter
 * Strips password hashes and confidential credentials from outgoing JSON responses.
 */
export const dlpFilterMiddleware = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const scrubConfidentialFields = (item) => {
      if (!item || typeof item !== "object") return item;

      // Preserve Date objects, Buffers, and RegExps intact without spreading into empty objects
      if (item instanceof Date || item instanceof Buffer || item instanceof RegExp) {
        return item;
      }

      if (Array.isArray(item)) {
        return item.map(scrubConfidentialFields);
      }

      const copy = { ...item };
      // Never expose password hashes or sensitive server secrets to client
      delete copy.passwordHash;
      delete copy.jwtSecret;

      // Only allow approvalPassword to be returned on the dedicated /admin/approval-password route
      if (!req.path.includes("/admin/approval-password") && copy.approvalPassword) {
        delete copy.approvalPassword;
      }

      for (const k of Object.keys(copy)) {
        if (copy[k] && typeof copy[k] === "object") {
          copy[k] = scrubConfidentialFields(copy[k]);
        }
      }
      return copy;
    };

    const sanitizedData = scrubConfidentialFields(data);
    return originalJson.call(this, sanitizedData);
  };

  next();
};
