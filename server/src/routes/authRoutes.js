import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { store } from "../db.js";
import { requireAuth, requireRole, signToken } from "../auth.js";

export const authRoutes = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRoutes.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = store.findUserByEmail(body.email);

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const { passwordHash, ...safeUser } = user;

  res.json({
    token: signToken(user),
    user: safeUser
  });
});

authRoutes.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRoutes.get("/users", requireAuth, requireRole("DEVELOPER", "ADMIN"), (req, res) => {
  const users =
    req.user.role === "DEVELOPER"
      ? store.listUsers({ accountId: req.query.accountId })
      : store.listUsers({ accountId: req.user.accountId, adminId: req.user.id, role: "USER" });

  res.json({ users });
});

authRoutes.get("/admins", requireAuth, requireRole("DEVELOPER"), (req, res) => {
  const admins = store.listAdmins({ accountId: req.query.accountId });

  res.json({ admins });
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]),
  accountId: z.string().optional(),
  adminId: z.string().optional()
});

authRoutes.post("/users", requireAuth, requireRole("DEVELOPER", "ADMIN"), async (req, res) => {
  const body = createUserSchema.parse(req.body);
  const accountId = req.user.role === "DEVELOPER" ? body.accountId : req.user.accountId;

  if (!accountId) {
    return res.status(400).json({ message: "accountId is required" });
  }

  if (req.user.role === "ADMIN" && body.role !== "USER") {
    return res.status(403).json({ message: "Admins can only create users" });
  }

  if (!store.findAccountById(accountId)) {
    return res.status(404).json({ message: "Account not found" });
  }

  let adminId = null;

  if (body.role === "USER") {
    adminId = req.user.role === "ADMIN" ? req.user.id : body.adminId;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required when creating a user" });
    }

    const admin = store.findUserById(adminId);

    if (!admin || admin.role !== "ADMIN" || admin.accountId !== accountId) {
      return res.status(400).json({ message: "User must be assigned to an admin in the same account" });
    }
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = store.createUser({
    email: body.email,
    name: body.name,
    passwordHash,
    role: body.role,
    accountId,
    adminId
  });

  delete user.passwordHash;
  res.status(201).json({ user });
});

authRoutes.delete("/users/:id", requireAuth, requireRole("DEVELOPER", "ADMIN"), (req, res) => {
  const targetUser = store.findUserById(req.params.id);

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (targetUser.id === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  if (targetUser.role === "DEVELOPER") {
    return res.status(403).json({ message: "Developer accounts cannot be deleted here" });
  }

  if (req.user.role === "ADMIN") {
    if (targetUser.accountId !== req.user.accountId || targetUser.role !== "USER" || targetUser.adminId !== req.user.id) {
      return res.status(403).json({ message: "Admins can only delete their own users" });
    }
  }

  store.deleteUser(targetUser.id);
  res.json({ deleted: true });
});
