import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth.js";
import { INTEGRATION_PLATFORMS, store } from "../db.js";
import { OtterlyApiClient } from "../otterlyApi.js";

export const accountRoutes = Router();

accountRoutes.get("/", requireAuth, requireRole("DEVELOPER"), async (_req, res) => {
  const accounts = await store.listAccounts();

  res.json({ accounts });
});

accountRoutes.get("/integrations", requireAuth, requireRole("DEVELOPER"), async (_req, res) => {
  const accounts = await store.listAccounts();
  const overview = await Promise.all(
    accounts.map(async (account) => ({
      account,
      integrations: await store.listAccountIntegrations(account.id)
    }))
  );

  res.json({ overview });
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

accountRoutes.post("/", requireAuth, requireRole("DEVELOPER"), async (req, res) => {
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
  if (req.user.role !== "DEVELOPER" && req.user.accountId !== req.params.id) {
    return res.status(403).json({ message: "You can only update your own company information" });
  }

  const body = updateAccountSchema.parse(req.body);
  const account = await store.updateAccount(req.params.id, body);

  if (!account) {
    return res.status(404).json({ message: "Company not found" });
  }

  res.json({ account });
});

accountRoutes.delete("/:id", requireAuth, requireRole("DEVELOPER"), async (req, res) => {
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
  if (req.user.role === "DEVELOPER") {
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

  const integrations = await store.listAccountIntegrations(req.params.id);
  res.json({
    integrations: req.user.role === "DEVELOPER"
      ? integrations
      : integrations.filter((integration) => integration.platformKey !== "otterly")
  });
});

const updateIntegrationSchema = z.object({
  status: z.enum(["connected", "disconnected"]),
  config: z
    .object({
      apiKey: z.string().optional(),
      workspaceId: z.string().optional(),
      brandReportId: z.string().optional(),
      brand: z.string().optional(),
      brandDomain: z.string().optional(),
      defaultCountry: z.string().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      syncInterval: z.string().optional(),
      sandbox: z.boolean().optional()
    })
    .optional()
});

accountRoutes.patch("/:id/integrations/:platformKey", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  if (req.params.platformKey === "otterly" && req.user.role !== "DEVELOPER") {
    return res.status(403).json({ message: "Otterly integrations are managed by the Cortexy developer account." });
  }
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
  const existingConfig = await store.getAccountIntegrationRawConfig(req.params.id, req.params.platformKey);
  const nextConfig = {
    ...existingConfig,
    ...(body.config ?? {})
  };
  if (body.config?.apiKey === "********") {
    nextConfig.apiKey = existingConfig.apiKey;
  }
  if (req.params.platformKey === "otterly" && body.status === "connected") {
    if (!nextConfig.apiKey || !nextConfig.workspaceId) {
      return res.status(400).json({ message: "Otterly API key and workspace ID are required." });
    }

    const existingAssignment = await store.findOtterlyWorkspaceAssignment(nextConfig.workspaceId, req.params.id);
    if (existingAssignment) {
      return res.status(409).json({
        code: "OTTERLY_WORKSPACE_ALREADY_ASSIGNED",
        message: `This Otterly workspace is already assigned to ${existingAssignment.accountName}. Disconnect it there before assigning it to another company.`
      });
    }

    const account = await store.findAccountById(req.params.id);
    const client = new OtterlyApiClient({ apiKey: nextConfig.apiKey });
    const reports = await client.listBrandReports(nextConfig.workspaceId);
    const reportItems = reports.items || [];
    if (!reportItems.length) {
      return res.status(400).json({ message: "No brand reports were found in this Otterly workspace." });
    }

    const normalize = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNames = new Set([
      account?.name,
      account?.slug,
      nextConfig.brand,
      nextConfig.brandDomain
    ].map(normalize).filter(Boolean));
    const matchingReport = reportItems.find((report) => [
      report.brand,
      report.reportTitle,
      report.brandDomain
    ].map(normalize).some((value) => targetNames.has(value)));
    const selectedReport = matchingReport || (reportItems.length === 1 ? reportItems[0] : null);
    if (!selectedReport) {
      return res.status(409).json({
        message: `Multiple Otterly brand reports were found and none matched ${account?.name || "this company"}. Add the company brand or domain and try again.`,
        reports: reportItems.map((report) => ({
          id: report.id,
          brand: report.brand,
          brandDomain: report.brandDomain,
          reportTitle: report.reportTitle
        }))
      });
    }

    const reportId = selectedReport.id || selectedReport.reportId;
    if (!reportId) {
      return res.status(502).json({ message: "Otterly returned a brand report without an ID." });
    }
    const report = reportId ? await client.getBrandReport(reportId) : selectedReport;
    nextConfig.brandReportId = reportId;
    nextConfig.brand = report.brand || selectedReport.brand || account?.name;
    nextConfig.brandDomain = report.brandDomain || selectedReport.brandDomain || "";
    nextConfig.defaultCountry = nextConfig.defaultCountry || report.countries?.[0] || "us";
  }
  if (body.status === "disconnected") {
    for (const key of Object.keys(nextConfig)) delete nextConfig[key];
  }
  const integration = await store.setAccountIntegration(req.params.id, req.params.platformKey, {
    status: body.status,
    config: nextConfig
  });

  res.json({ integration });
});
