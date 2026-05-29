import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth.js";
import { store } from "../db.js";

export const accountRoutes = Router();

accountRoutes.get("/", requireAuth, requireRole("DEVELOPER"), async (_req, res) => {
  const accounts = store.listAccounts();

  res.json({ accounts });
});

const createAccountSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/)
});

accountRoutes.post("/", requireAuth, requireRole("DEVELOPER"), async (req, res) => {
  const body = createAccountSchema.parse(req.body);
  const account = store.createAccount(body);

  res.status(201).json({ account });
});
