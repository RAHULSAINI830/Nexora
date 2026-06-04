import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth.js";
import { INTEGRATION_PLATFORMS, store } from "../db.js";

export const accountRoutes = Router();

accountRoutes.get("/", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER"), async (_req, res) => {
  const accounts = await store.listAccounts();

  res.json({ accounts });
});

const createAccountSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  tagline: z.string().optional(),
  billingAddressLine1: z.string().min(1),
  billingAddressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  zipcode: z.string().min(1),
  administrator: z.string().min(1),
  cellphone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  branchName: z.string().optional()
});

accountRoutes.post("/", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER"), async (req, res) => {
  const { branchName, ...accountData } = createAccountSchema.parse(req.body);
  const account = await store.createAccount(accountData);

  if (branchName && branchName.trim()) {
    await store.createBranch({
      name: branchName.trim(),
      accountId: account.id
    });
  }

  res.status(201).json({ account });
});

const updateAccountSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  tagline: z.string().optional(),
  billingAddressLine1: z.string().min(1).optional(),
  billingAddressLine2: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  zipcode: z.string().min(1).optional(),
  administrator: z.string().min(1).optional(),
  cellphone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional()
});

accountRoutes.patch("/:id", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  if (req.user.role !== "DEVELOPER" && req.user.role !== "SUPER_ADMIN" && req.user.accountId !== req.params.id) {
    return res.status(403).json({ message: "You can only update your own company information" });
  }

  const body = updateAccountSchema.parse(req.body);
  const account = await store.updateAccount(req.params.id, body);

  if (!account) {
    return res.status(404).json({ message: "Company not found" });
  }

  res.json({ account });
});

accountRoutes.delete("/:id", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER"), async (req, res) => {
  if (req.params.id === req.user.accountId) {
    return res.status(400).json({ message: "You cannot delete the company account you are currently logged into" });
  }

  const success = await store.deleteAccount(req.params.id);
  if (!success) {
    return res.status(404).json({ message: "Company not found" });
  }

  res.json({ deleted: true });
});

function canAccessAccount(req, accountId) {
  if (req.user.role === "DEVELOPER" || req.user.role === "SUPER_ADMIN") {
    return true;
  }

  return req.user.accountId === accountId;
}

accountRoutes.get("/:id/integrations", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  if (!canAccessAccount(req, req.params.id)) {
    return res.status(403).json({ message: "You can only view integrations for your own company" });
  }

  if (!await store.findAccountById(req.params.id)) {
    return res.status(404).json({ message: "Company not found" });
  }

  res.json({
    integrations: await store.listAccountIntegrations(req.params.id)
  });
});

const updateIntegrationSchema = z.object({
  status: z.enum(["connected", "disconnected"]),
  config: z
    .object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      syncInterval: z.string().optional(),
      sandbox: z.boolean().optional()
    })
    .optional()
});

accountRoutes.patch("/:id/integrations/:platformKey", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  if (!canAccessAccount(req, req.params.id)) {
    return res.status(403).json({ message: "You can only update integrations for your own company" });
  }

  if (!await store.findAccountById(req.params.id)) {
    return res.status(404).json({ message: "Company not found" });
  }

  if (!INTEGRATION_PLATFORMS.some((platform) => platform.key === req.params.platformKey)) {
    return res.status(404).json({ message: "Integration platform not found" });
  }

  const body = updateIntegrationSchema.parse(req.body);
  const integration = await store.setAccountIntegration(req.params.id, req.params.platformKey, {
    status: body.status,
    config: body.config ?? {}
  });

  res.json({ integration });
});
