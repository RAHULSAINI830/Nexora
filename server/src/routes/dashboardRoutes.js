import { Router } from "express";
import { accountScopeFor, requireAuth, requireRole } from "../auth.js";
import { store } from "../db.js";
import { fetchExternalDashboardData } from "../externalApi.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/records", requireAuth, async (req, res) => {
  const scope = accountScopeFor(req.user, req.query.accountId);
  let records = await store.listDashboardRecords(scope);

  // Apply role-based record scoping dynamically
  if (req.user.role === "BRANCH_MANAGER" && req.user.branchId) {
    const branch = await store.findBranchById(req.user.branchId);
    if (branch) {
      const branchKeyword = branch.name.split(" ")[0].toLowerCase(); // e.g. "north"
      records = records.filter((r) => {
        let rawObj = {};
        try {
          rawObj = typeof r.raw === "string" ? JSON.parse(r.raw) : (r.raw || {});
        } catch {
          rawObj = {};
        }
        const inRaw = rawObj && rawObj.branch && String(rawObj.branch).toLowerCase().includes(branchKeyword);
        const inTitle = r.title.toLowerCase().includes(branchKeyword);
        return inRaw || inTitle;
      });
    }
  } else if (req.user.role === "TECHNICIAN") {
    // Technicians only see performance stats or reviews (anything with Technician or tech in name)
    records = records.filter((r) => {
      return r.title.toLowerCase().includes("technician") || r.sourceId.toLowerCase().includes("tech");
    });
  }

  res.json({ records });
});

dashboardRoutes.post("/sync", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  const accountId =
    req.user.role === "DEVELOPER"
      ? req.body.accountId || req.user.accountId
      : req.user.accountId;

  if (!accountId) {
    return res.status(400).json({ message: "accountId is required" });
  }

  try {
    const sourceRecords = await fetchExternalDashboardData({ accountId });
    const synced = await store.upsertDashboardRecords(accountId, sourceRecords);

    res.json({ synced });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to sync data" });
  }
});
