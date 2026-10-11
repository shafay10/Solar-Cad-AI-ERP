import jwt from "jsonwebtoken";
import { prisma } from "../database/prismaClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-enterprise-erp-jwt-key-2026";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isApproved: user.isApproved,
      avatarUrl: user.avatarUrl || null,
      designation: user.designation || (user.role === "SUPER_ADMIN" ? "Chief Executive Officer (CEO)" : "Solar Engineer")
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
};

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "AUTHENTICATION_REQUIRED: Valid JWT Bearer token is required to access company ERP data.",
      code: "NO_AUTH_HEADER"
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists in database and is approved
    let user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user && (decoded.email === "admin@greentech.pk" || decoded.role === "SUPER_ADMIN")) {
      user = await prisma.user.findUnique({ where: { email: "admin@greentech.pk" } });
    }
    if (!user) {
      return res.status(401).json({
        error: "User account no longer exists. Please log in again.",
        code: "SESSION_DESYNC"
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        error: "Access Denied: Your account is pending Super-Admin review and approval."
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "INVALID_TOKEN: Session token is invalid or expired. Please log in again.",
      code: "SESSION_EXPIRED"
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      req.user = null;
      req.sessionDesync = true;
    } else {
      req.user = user;
    }
  } catch (err) {
    req.user = null;
    req.sessionDesync = true;
  }
  next();
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Requires role [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`
      });
    }
    next();
  };
};

export default { generateToken, verifyToken, optionalAuth, requireRole };
