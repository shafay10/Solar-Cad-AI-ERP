/**
 * Enterprise Date Utility
 * Provides 100% crash-proof date parsing, ISO serialization, and localization.
 * Handles edge cases like empty objects {}, null, undefined, and malformed strings.
 */

export const safeIsoString = (val, length = null) => {
  if (!val) return "";
  if (typeof val === "object" && !(val instanceof Date)) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const iso = d.toISOString();
    return length ? iso.slice(0, length) : iso;
  } catch {
    return "";
  }
};

export const safeFormatDate = (val, fallback = "Pending", locale = "en-PK", options = {}) => {
  if (!val) return fallback;
  if (typeof val === "object" && !(val instanceof Date)) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
};

export const safeFormatDateTime = (val, fallback = "Pending", locale = "en-PK") => {
  if (!val) return fallback;
  if (typeof val === "object" && !(val instanceof Date)) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString(locale);
  } catch {
    return fallback;
  }
};

/**
 * Formats a date with day of the week, full date, and formatted 12-hour time.
 * E.g., "Monday, 14-Sep-2026 • 10:35 AM"
 */
export const formatDateWithDay = (val, fallback = "Pending") => {
  if (!val) return fallback;
  if (typeof val === "object" && !(val instanceof Date)) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[d.getDay()];
    const dateNum = String(d.getDate()).padStart(2, "0");
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, "0");
    return `${dayName}, ${dateNum}-${monthName}-${year} • ${hourStr}:${minutes} ${ampm}`;
  } catch {
    return fallback;
  }
};

/**
 * Formats a date with day of the week and date only.
 * E.g., "Monday, 14-Sep-2026"
 */
export const formatDateAndDayOnly = (val, fallback = "Pending") => {
  if (!val) return fallback;
  if (typeof val === "object" && !(val instanceof Date)) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[d.getDay()];
    const dateNum = String(d.getDate()).padStart(2, "0");
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${dateNum}-${monthName}-${year}`;
  } catch {
    return fallback;
  }
};

