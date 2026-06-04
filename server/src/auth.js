import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { store } from "./db.js";

function activityName(req) {
  const path = req.originalUrl?.split("?")[0] || req.path || "/";
  return `${req.method} ${path}`;
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      accountId: user.accountId
    },
    config.jwtSecret,
    { algorithm: "HS256", expiresIn: "8h" }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    const user = await store.findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: "Email verification is required" });
    }

    delete user.passwordHash;
    delete user.verificationCodeHash;
    delete user.verificationCodeExpiresAt;
    req.user = user;

    await store.createAuditLog({
      userId: user.id,
      accountId: user.accountId,
      action: activityName(req),
      method: req.method,
      path: req.originalUrl?.split("?")[0] || req.path
    });

    next();
  } catch {
    return res.status(401).json({ message: "Invalid auth token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed for this role" });
    }

    next();
  };
}

export function accountScopeFor(user, requestedAccountId) {
  if (user.role === "DEVELOPER") {
    return requestedAccountId && requestedAccountId !== "all" ? { accountId: requestedAccountId } : {};
  }

  return { accountId: user.accountId };
}

export function recordScopeFor(user) {
  if (user.role === "BRANCH_MANAGER" || user.role === "TECHNICIAN") {
    return { accountId: user.accountId, branchId: user.branchId, role: user.role, userId: user.id };
  }

  return { accountId: user.accountId };
}
