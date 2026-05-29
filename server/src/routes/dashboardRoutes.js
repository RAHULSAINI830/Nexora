import { Router } from "express";
import { accountScopeFor, requireAuth, requireRole } from "../auth.js";
import { store } from "../db.js";
import { fetchExternalDashboardData } from "../externalApi.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/records", requireAuth, async (req, res) => {
  const where = accountScopeFor(req.user, req.query.accountId);
  const records = store.listDashboardRecords(where);

  res.json({ records });
});

dashboardRoutes.post("/sync", requireAuth, requireRole("DEVELOPER", "ADMIN"), async (req, res) => {
  const accountId = req.user.role === "DEVELOPER" ? req.body.accountId : req.user.accountId;

  if (!accountId) {
    return res.status(400).json({ message: "accountId is required" });
  }

  const sourceRecords = await fetchExternalDashboardData();
  const synced = store.upsertDashboardRecords(accountId, sourceRecords);

  res.json({ synced });
});
