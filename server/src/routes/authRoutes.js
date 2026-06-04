import bcrypt from "bcryptjs";
import { createHmac, randomInt } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { store } from "../db.js";
import { sendVerificationCode } from "../email.js";
import { config } from "../config.js";
import { requireAuth, requireRole, signToken } from "../auth.js";

export const authRoutes = Router();

export const ROLE_LEVELS = {
  DEVELOPER: 8,
  SUPER_ADMIN: 7,
  BUSINESS_OWNER: 6,
  MARKETING_MANAGER: 5,
  OPERATIONS_MANAGER: 5,
  BRANCH_MANAGER: 4,
  ANALYST: 3,
  TECHNICIAN: 2
};

function canUseGlobalScope(user) {
  return user.role === "DEVELOPER" || user.role === "SUPER_ADMIN";
}

function safeUser(user) {
  const { passwordHash, verificationCodeHash, verificationCodeExpiresAt, ...safe } = user;
  return safe;
}

function hashVerificationCode(code) {
  return createHmac("sha256", config.jwtSecret).update(code).digest("hex");
}

async function issueVerificationCode(user) {
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await store.setVerificationCode(user.id, {
    codeHash: hashVerificationCode(code),
    expiresAt
  });
  await sendVerificationCode({ email: user.email, name: user.name, code });
}

function canActOnRole(actorRole, targetRole) {
  return ROLE_LEVELS[targetRole] < ROLE_LEVELS[actorRole];
}

function filterVisibleUsersForActor(actor, users) {
  if (actor.role === "DEVELOPER") {
    return users;
  }

  if (actor.role === "SUPER_ADMIN") {
    return users.filter((u) => u.role !== "DEVELOPER");
  }

  return users.filter((u) => u.accountId === actor.accountId && canActOnRole(actor.role, u.role));
}

function resolveAccountIdForActor(actor, requestedAccountId) {
  if (canUseGlobalScope(actor)) {
    return requestedAccountId || actor.accountId;
  }

  return actor.accountId;
}

async function validateAccountBoundReference({ res, accountId, referenceId, type, targetRole }) {
  if (!referenceId) return true;

  if (type === "manager") {
    const manager = await store.findUserById(referenceId);
    if (!manager || manager.accountId !== accountId || !canActOnRole(manager.role, targetRole)) {
      res.status(400).json({ message: "Reporting manager must be in the same company and above the target role" });
      return false;
    }
    return true;
  }

  if (type === "branch") {
    const branch = await store.findBranchById(referenceId);
    if (!branch || branch.account_id !== accountId) {
      res.status(400).json({ message: "Branch must belong to the same company as the user" });
      return false;
    }
    return true;
  }

  return true;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRoutes.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await store.findUserByEmail(body.email.toLowerCase());

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!user.emailVerified) {
    const codeExpired = !user.verificationCodeExpiresAt || new Date(user.verificationCodeExpiresAt) <= new Date();
    if (codeExpired) {
      await issueVerificationCode(user);
    }
    return res.status(403).json({
      code: "EMAIL_VERIFICATION_REQUIRED",
      message: "Verify your email before signing in",
      email: user.email
    });
  }

  res.json({
    token: signToken(user),
    user: safeUser(user)
  });
});

const verificationSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit verification code")
});

authRoutes.post("/verify-email", async (req, res) => {
  const body = verificationSchema.parse(req.body);
  const user = await store.findUserByEmail(body.email.toLowerCase());

  if (!user || user.emailVerified) {
    return res.status(400).json({ message: "Verification code is invalid or no longer required" });
  }

  if (!user.verificationCodeHash || !user.verificationCodeExpiresAt || new Date(user.verificationCodeExpiresAt) <= new Date()) {
    return res.status(400).json({ message: "Verification code has expired. Request a new code." });
  }

  if (hashVerificationCode(body.code) !== user.verificationCodeHash) {
    return res.status(400).json({ message: "Verification code is incorrect" });
  }

  const verifiedUser = await store.markEmailVerified(user.id);
  res.json({
    token: signToken(verifiedUser),
    user: safeUser(verifiedUser)
  });
});

const resendVerificationSchema = z.object({
  email: z.string().email()
});

authRoutes.post("/resend-verification", async (req, res) => {
  const body = resendVerificationSchema.parse(req.body);
  const user = await store.findUserByEmail(body.email.toLowerCase());

  if (user && !user.emailVerified) {
    await issueVerificationCode(user);
  }

  res.json({ message: "If the account requires verification, a new code has been sent." });
});

authRoutes.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const sanitizeString = (val) => {
  if (typeof val !== "string") return val;
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

const sanitizedStringSchema = z.string().min(2).transform(sanitizeString);
const optionalSanitizedStringSchema = z.string().min(2).optional().transform((val) => val ? sanitizeString(val) : undefined);

const strongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .refine((val) => /[A-Z]/.test(val), { message: "Password must contain at least one uppercase letter" })
  .refine((val) => /[a-z]/.test(val), { message: "Password must contain at least one lowercase letter" })
  .refine((val) => /[0-9]/.test(val), { message: "Password must contain at least one digit" })
  .refine((val) => /[^A-Za-z0-9]/.test(val), { message: "Password must contain at least one special character" });

const optionalStrongPasswordSchema = z.union([
  z.string().length(0),
  strongPasswordSchema
]).optional().transform((val) => !val ? undefined : val);

const updateSelfSchema = z.object({
  name: optionalSanitizedStringSchema,
  password: optionalStrongPasswordSchema
});

authRoutes.patch("/me", requireAuth, async (req, res) => {
  const body = updateSelfSchema.parse(req.body);
  
  let passwordHash;
  if (body.password) {
    passwordHash = await bcrypt.hash(body.password, 12);
  }

  const user = await store.updateUser(req.user.id, {
    name: body.name,
    passwordHash
  });

  res.json({ user: safeUser(user) });
});

authRoutes.get("/users", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  let accountId = undefined;
  
  if (canUseGlobalScope(req.user)) {
    if (req.query.accountId && req.query.accountId !== "all") {
      accountId = req.query.accountId;
    } else if (req.query.accountId === "all") {
      accountId = undefined;
    } else {
      accountId = req.user.accountId;
    }
  } else {
    accountId = req.user.accountId;
  }

  const users = filterVisibleUsersForActor(req.user, await store.listUsers({ accountId }));
  res.json({ users });
});

authRoutes.get("/admins", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  const accountId = canUseGlobalScope(req.user)
    ? (req.query.accountId || req.user.accountId) 
    : req.user.accountId;
  const potentialManagers = (await store.listUsers({ accountId }))
    .filter((u) => ["BUSINESS_OWNER", "BRANCH_MANAGER"].includes(u.role));
  const admins = req.user.role === "BUSINESS_OWNER"
    ? potentialManagers.filter((u) => u.id === req.user.id || canActOnRole(req.user.role, u.role))
    : filterVisibleUsersForActor(req.user, potentialManagers);

  res.json({ admins });
});

authRoutes.get("/branches", requireAuth, async (req, res) => {
  const accountId = canUseGlobalScope(req.user)
    ? (req.query.accountId || req.user.accountId) 
    : req.user.accountId;
  if (!accountId) {
    return res.json({ branches: [] });
  }
  const branches = await store.listBranches(accountId);
  res.json({ branches });
});

const createUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: strongPasswordSchema,
  role: z.enum([
    "DEVELOPER", "SUPER_ADMIN", "BUSINESS_OWNER", "MARKETING_MANAGER", 
    "OPERATIONS_MANAGER", "BRANCH_MANAGER", "TECHNICIAN", "ANALYST"
  ]),
  accountId: z.string().optional(),
  companyName: z.string().optional(),
  adminId: z.string().optional(),
  branchId: z.string().optional()
});

authRoutes.post("/users", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  const body = createUserSchema.parse(req.body);

  if (body.role === "SUPER_ADMIN" && req.user.role !== "DEVELOPER") {
    return res.status(403).json({ 
      message: "Only developers can create SUPER_ADMIN accounts" 
    });
  }

  // Enforce role hierarchy: creator's role level must be strictly higher than the target user's role level.
  if (ROLE_LEVELS[body.role] >= ROLE_LEVELS[req.user.role]) {
    return res.status(403).json({ 
      message: `You cannot create a user with a role level higher than or equal to your own (${req.user.role} -> ${body.role})` 
    });
  }

  let accountId;
  if (body.role === "SUPER_ADMIN") {
    if (!body.companyName || !body.companyName.trim()) {
      return res.status(400).json({ message: "Company name is required when creating a Super Admin" });
    }
    const slug = body.companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let existingAccount = (await store.listAccounts()).find(a => a.slug === slug);
    if (!existingAccount) {
      existingAccount = await store.createAccount({
        name: body.companyName.trim(),
        slug,
        billingAddressLine1: "123 Main St",
        city: "Toronto",
        state: "ON",
        country: "Canada",
        zipcode: "M5V 2T6",
        administrator: body.name
      });
    }
    accountId = existingAccount.id;
  } else {
    accountId = resolveAccountIdForActor(req.user, body.accountId);
    if (!accountId) {
      return res.status(400).json({ message: "accountId is required for company users" });
    }
    if (!await store.findAccountById(accountId)) {
      return res.status(404).json({ message: "Company not found" });
    }
  }

  let adminId = body.adminId || null;
  let branchId = body.branchId || null;

  if (body.role === "TECHNICIAN" && !adminId && req.user.role === "BUSINESS_OWNER") {
    adminId = req.user.id;
  }

  if (!await validateAccountBoundReference({ res, accountId, referenceId: adminId, type: "manager", targetRole: body.role })) {
    return;
  }

  if (!await validateAccountBoundReference({ res, accountId, referenceId: branchId, type: "branch", targetRole: body.role })) {
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await store.createUser({
    id: body.id,
    email: body.email.toLowerCase(),
    name: body.name,
    passwordHash,
    role: body.role,
    accountId: accountId,
    adminId,
    branchId
  });

  let emailDelivered = true;
  try {
    await issueVerificationCode(user);
  } catch (error) {
    emailDelivered = false;
    console.error("Failed to send verification email", error);
  }

  res.status(201).json({
    user: safeUser(user),
    emailDelivered,
    message: emailDelivered
      ? "User created and verification code sent."
      : "User created, but the verification email could not be sent. Use resend verification after email is configured."
  });
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: optionalSanitizedStringSchema,
  password: optionalStrongPasswordSchema,
  role: z.enum([
    "DEVELOPER", "SUPER_ADMIN", "BUSINESS_OWNER", "MARKETING_MANAGER", 
    "OPERATIONS_MANAGER", "BRANCH_MANAGER", "TECHNICIAN", "ANALYST"
  ]).optional(),
  accountId: z.string().optional(),
  companyName: z.string().optional(),
  adminId: z.string().optional(),
  branchId: z.string().optional()
});

authRoutes.patch("/users/:id", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  const targetUser = await store.findUserById(req.params.id);
  if (!targetUser || (targetUser.role === "DEVELOPER" && req.user.role !== "DEVELOPER")) {
    return res.status(404).json({ message: "User not found" });
  }

  if (targetUser.role === "SUPER_ADMIN" && req.user.role !== "DEVELOPER") {
    return res.status(403).json({ message: "Only developers can edit SUPER_ADMIN users" });
  }

  // Enforce role hierarchy: modifier's role level must be strictly higher than the target user's current role level.
  if (ROLE_LEVELS[targetUser.role] >= ROLE_LEVELS[req.user.role]) {
    return res.status(403).json({ message: "You cannot edit a user with a role level higher than or equal to your own" });
  }

  if (!canUseGlobalScope(req.user) && targetUser.accountId !== req.user.accountId) {
    return res.status(403).json({ message: "You can only edit users within your own company" });
  }

  const body = updateUserSchema.parse(req.body);

  if (body.role === "SUPER_ADMIN" && req.user.role !== "DEVELOPER") {
    return res.status(403).json({ message: "Only developers can update users to SUPER_ADMIN" });
  }

  if (targetUser.role === "SUPER_ADMIN" && body.companyName && body.companyName.trim()) {
    await store.updateAccount(targetUser.accountId, { name: body.companyName.trim() });
  }
  
  // Enforce role hierarchy: modifier's role level must be strictly higher than the new role level being assigned.
  if (body.role && ROLE_LEVELS[body.role] >= ROLE_LEVELS[req.user.role]) {
    return res.status(403).json({ message: "You cannot assign a role level higher than or equal to your own" });
  }

  const nextRole = body.role || targetUser.role;
  const nextAccountId = resolveAccountIdForActor(req.user, body.accountId || targetUser.accountId);

  if (nextRole !== "DEVELOPER" && !nextAccountId) {
    return res.status(400).json({ message: "accountId is required for company users" });
  }

  if (nextAccountId && !await store.findAccountById(nextAccountId)) {
    return res.status(404).json({ message: "Company not found" });
  }

  if (!await validateAccountBoundReference({ res, accountId: nextAccountId, referenceId: body.adminId, type: "manager", targetRole: nextRole })) {
    return;
  }

  if (!await validateAccountBoundReference({ res, accountId: nextAccountId, referenceId: body.branchId, type: "branch", targetRole: nextRole })) {
    return;
  }

  let passwordHash;
  if (body.password) {
    passwordHash = await bcrypt.hash(body.password, 12);
  }

  const user = await store.updateUser(targetUser.id, {
    email: body.email?.toLowerCase(),
    name: body.name,
    passwordHash,
    role: body.role,
    accountId: body.accountId !== undefined ? nextAccountId : undefined,
    adminId: body.adminId !== undefined ? body.adminId : undefined,
    branchId: body.branchId !== undefined ? body.branchId : undefined
  });

  let message = "User updated successfully.";
  if (body.email && body.email.toLowerCase() !== targetUser.email.toLowerCase()) {
    await store.clearEmailVerification(user.id);
    const unverifiedUser = await store.findUserById(user.id);
    try {
      await issueVerificationCode(unverifiedUser);
      message = "User updated. A verification code was sent to the new email address.";
    } catch (error) {
      console.error("Failed to send verification email", error);
      message = "User updated, but the verification email could not be sent.";
    }
    return res.json({ user: safeUser(unverifiedUser), message });
  }

  res.json({ user: safeUser(user), message });
});

authRoutes.delete("/users/:id", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  const targetUser = await store.findUserById(req.params.id);

  if (!targetUser || (targetUser.role === "DEVELOPER" && req.user.role !== "DEVELOPER")) {
    return res.status(404).json({ message: "User not found" });
  }

  if (targetUser.id === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  // Enforce role hierarchy: deleter's role level must be strictly higher than the target user's role level.
  if (ROLE_LEVELS[targetUser.role] >= ROLE_LEVELS[req.user.role]) {
    return res.status(403).json({ message: "You cannot delete a user with a role level higher than or equal to your own" });
  }

  if (!canUseGlobalScope(req.user) && targetUser.accountId !== req.user.accountId) {
    return res.status(403).json({ message: "You can only delete users within your own company" });
  }

  await store.deleteUser(targetUser.id);
  res.json({ deleted: true });
});
