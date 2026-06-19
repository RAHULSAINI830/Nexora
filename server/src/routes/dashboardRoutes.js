import { Router } from "express";
import { z } from "zod";
import { accountScopeFor, requireAuth, requireRole } from "../auth.js";
import { store } from "../db.js";
import { fetchOtterlyBundle, OtterlyApiClient } from "../otterlyApi.js";

export const dashboardRoutes = Router();
const activeSyncAccounts = new Set();

dashboardRoutes.get("/records", requireAuth, async (req, res) => {
  if (req.user.role === "DEVELOPER" && (!req.query.accountId || req.query.accountId === "all")) {
    return res.status(400).json({ message: "Select a company before loading dashboard records." });
  }
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

  res.json({
    source: "cortexy-database",
    accountId: scope.accountId,
    records
  });
});

dashboardRoutes.get("/otterly", requireAuth, async (req, res) => {
  const scope = accountScopeFor(req.user, req.query.accountId);
  const accountId = scope.accountId || req.user.accountId;

  if (!accountId) {
    return res.status(400).json({ message: "accountId is required" });
  }

  const [resources, latestSync, integration] = await Promise.all([
    store.listOtterlyResources(accountId),
    store.latestOtterlySyncRun(accountId),
    store.getAccountIntegration(accountId, "otterly")
  ]);

  res.json({
    source: "cortexy-database",
    accountId,
    integration,
    latestSync,
    resources,
    dashboard: buildOtterlyDashboard(resources, latestSync)
  });
});

dashboardRoutes.post("/sync", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  const accountId =
    req.user.role === "DEVELOPER"
      ? req.body.accountId || req.user.accountId
      : req.user.accountId;

  if (!accountId) {
    return res.status(400).json({ message: "accountId is required" });
  }

  if (activeSyncAccounts.has(accountId)) {
    return res.status(409).json({
      code: "OTTERLY_SYNC_IN_PROGRESS",
      message: "An Otterly sync is already running for this company."
    });
  }

  activeSyncAccounts.add(accountId);

  try {
    const integration = await store.getAccountIntegration(accountId, "otterly");
    const otterlyConfig = await store.getAccountIntegrationRawConfig(accountId, "otterly");

    if (integration?.status === "connected" && otterlyConfig.workspaceId && otterlyConfig.brandReportId) {
      const syncRun = await store.createOtterlySyncRun({
        accountId,
        workspaceId: otterlyConfig.workspaceId,
        reportId: otterlyConfig.brandReportId,
        createdByUserId: req.user.id
      });

      try {
        const bundle = await fetchOtterlyBundle({
          apiKey: otterlyConfig.apiKey,
          workspaceId: otterlyConfig.workspaceId,
          reportId: otterlyConfig.brandReportId,
          country: otterlyConfig.defaultCountry || req.body.country,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          engines: req.body.engines
        });

        const syncedResources = await store.upsertOtterlyResources(accountId, bundle);
        const dashboardRecords = otterlyBundleToDashboardRecords(bundle);
        await store.upsertDashboardRecords(accountId, dashboardRecords);
        const completed = await store.finishOtterlySyncRun(syncRun.id, {
          status: "completed",
          summary: {
            ...bundle.summary,
            resourceCount: syncedResources,
            startDate: bundle.startDate,
            endDate: bundle.endDate,
            country: bundle.country
          }
        });

        return res.json({
          provider: "otterly",
          synced: dashboardRecords.length,
          syncedResources,
          syncRun: completed,
          summary: bundle.summary
        });
      } catch (error) {
        await store.finishOtterlySyncRun(syncRun.id, {
          status: "failed",
          error: error.message || "Otterly sync failed"
        });
        throw error;
      }
    }

    return res.status(400).json({
      message: "Otterly is not connected for this company. Assign an Otterly workspace in Settings > Integrations."
    });
  } catch (error) {
    const limitExceeded = error.status === 429 || /team request limit exceeded/i.test(error.message || "");
    res.status(limitExceeded ? 429 : error.status || 500).json({
      code: limitExceeded ? "OTTERLY_REQUEST_LIMIT" : undefined,
      message: limitExceeded
        ? "Otterly's team request limit has been reached. Wait for the quota to reset or increase the account limit."
        : error.message || "Failed to sync data"
    });
  } finally {
    activeSyncAccounts.delete(accountId);
  }
});

const geoAuditSchema = z.object({
  accountId: z.string().optional(),
  url: z.string().url(),
  crawlerIdentity: z.enum(["ChatGPT-User", "OAI-SearchBot", "PerplexityCrawler", "GoogleBot"]).optional(),
  sendOtterlyHeader: z.boolean().optional()
});

dashboardRoutes.post("/otterly/audits/:type", requireAuth, requireRole("SUPER_ADMIN", "DEVELOPER", "BUSINESS_OWNER"), async (req, res) => {
  const type = req.params.type;
  if (!["crawlability", "content"].includes(type)) {
    return res.status(404).json({ message: "Unsupported audit type" });
  }

  const body = geoAuditSchema.parse(req.body);
  const accountId = req.user.role === "DEVELOPER" ? body.accountId || req.user.accountId : req.user.accountId;
  if (!accountId) {
    return res.status(400).json({ message: "accountId is required" });
  }

  try {
    const otterlyConfig = await store.getAccountIntegrationRawConfig(accountId, "otterly");
    if (!otterlyConfig?.apiKey || !otterlyConfig?.workspaceId || !otterlyConfig?.brandReportId) {
      return res.status(400).json({ message: "Otterly integration must be connected before running GEO audits." });
    }

    const client = new OtterlyApiClient({ apiKey: otterlyConfig.apiKey });
    const created = type === "crawlability"
      ? await client.createCrawlabilityCheck({ workspaceId: otterlyConfig.workspaceId, url: body.url })
      : await client.createContentCheck({
        workspaceId: otterlyConfig.workspaceId,
        url: body.url,
        crawlerIdentity: body.crawlerIdentity,
        sendOtterlyHeader: body.sendOtterlyHeader
      });

    const existingResources = await store.getOtterlyResourceMap(accountId);
    const [crawlabilityResult, contentResult] = await Promise.allSettled([
      client.listCrawlabilityChecks(otterlyConfig.workspaceId),
      client.listContentChecks(otterlyConfig.workspaceId)
    ]);
    const crawlabilityChecks = crawlabilityResult.status === "fulfilled"
      ? crawlabilityResult.value
      : existingResources["crawlability-checks"]?.payload || { items: [] };
    const contentChecks = contentResult.status === "fulfilled"
      ? contentResult.value
      : existingResources["content-checks"]?.payload || { items: [] };

    const normalizeAuditList = (payload, audit) => {
      const items = Array.isArray(payload.items) ? payload.items : [];
      if (!audit?.id || items.some((item) => item.id === audit.id)) return payload;
      return { ...payload, items: [audit, ...items] };
    };

    const nextCrawlabilityChecks = type === "crawlability" ? normalizeAuditList(crawlabilityChecks, created) : crawlabilityChecks;
    const nextContentChecks = type === "content" ? normalizeAuditList(contentChecks, created) : contentChecks;

    const resources = [
      {
        resourceType: "crawlability-checks",
        resourceKey: otterlyConfig.workspaceId,
        payload: nextCrawlabilityChecks
      },
      {
        resourceType: "content-checks",
        resourceKey: otterlyConfig.workspaceId,
        payload: nextContentChecks
      }
    ];

    await store.upsertOtterlyResources(accountId, {
      workspaceId: otterlyConfig.workspaceId,
      reportId: otterlyConfig.brandReportId,
      resources
    });

    res.status(201).json({
      auditType: type,
      audit: created,
      crawlabilityChecks: nextCrawlabilityChecks,
      contentChecks: nextContentChecks,
      refreshWarnings: [
        ...(crawlabilityResult.status === "rejected" ? ["Crawlability history refresh is delayed."] : []),
        ...(contentResult.status === "rejected" ? ["Content history refresh is delayed."] : [])
      ]
    });
  } catch (error) {
    console.error("GEO AUDIT API ERROR:", {
      message: error.message,
      status: error.status,
      payload: error.payload
    });
    const limitExceeded = error.status === 429 || /team request limit exceeded/i.test(error.message || "");
    if (limitExceeded) {
      return res.status(429).json({
        code: "OTTERLY_REQUEST_LIMIT",
        message: "Otterly's team request limit has been reached. Wait for the Otterly quota to reset or increase the account limit before starting another audit."
      });
    }
    if (error.status === 403) {
      return res.status(403).json({
        code: "OTTERLY_AUDIT_FORBIDDEN",
        message: "Otterly denied GEO audit creation for this API key and workspace. Audit write access requires an eligible Otterly plan and API key permissions."
      });
    }
    res.status(error.status || 500).json({ message: error.message || "Failed to run GEO audit" });
  }
});

function resourcePayload(resources, type) {
  return resources.find((resource) => resource.resourceType === type)?.payload || null;
}

function mergeAuditPayloads(details, checks) {
  const merged = new Map();
  for (const item of checks?.items || []) {
    if (item.id) merged.set(item.id, item);
  }
  for (const item of details?.items || []) {
    if (!item.id) continue;
    merged.set(item.id, { ...(merged.get(item.id) || {}), ...item });
  }
  return { items: [...merged.values()] };
}

function buildOtterlyDashboard(resources, latestSync) {
  const report = resourcePayload(resources, "brand-report");
  const stats = resourcePayload(resources, "brand-report-stats");
  const citations = resourcePayload(resources, "citations");
  const citationStats = resourcePayload(resources, "citation-stats");
  const prompts = resourcePayload(resources, "prompts");
  const aiResponses = resourcePayload(resources, "ai-responses");
  const recommendations = resourcePayload(resources, "recommendations");
  const crawlabilityDetails = resourcePayload(resources, "crawlability-details");
  const crawlabilityChecks = resourcePayload(resources, "crawlability-checks");
  const contentDetails = resourcePayload(resources, "content-details");
  const contentChecks = resourcePayload(resources, "content-checks");
  const crawlability = mergeAuditPayloads(crawlabilityDetails, crawlabilityChecks);
  const content = mergeAuditPayloads(contentDetails, contentChecks);
  const accountInfo = resourcePayload(resources, "account-info");

  const summary = stats?.summary || {};
  const recommendationItems = recommendations?.items || [];
  const citationItems = citations?.items || [];
  const promptItems = prompts?.items || [];
  const responseGroups = aiResponses?.items || [];

  const brandCoverage = Number(summary.brandCoverage || 0);
  const domainCoverage = Number(summary.domainCoverage || 0);
  const shareOfVoice = Number(summary.shareOfVoice || 0);
  const geoScore = Math.round((brandCoverage * 0.35) + (domainCoverage * 0.35) + (shareOfVoice * 0.2) + Math.min(10, recommendationItems.length) * 1);

  return {
    brand: report?.brand || latestSync?.summary?.brand || null,
    brandDomain: report?.brandDomain || latestSync?.summary?.brandDomain || null,
    reportTitle: report?.reportTitle || report?.brand || null,
    countries: report?.countries || [],
    competitors: report?.competitors || [],
    lastSyncedAt: latestSync?.completedAt || latestSync?.startedAt || null,
    syncStatus: latestSync?.status || "not-synced",
    kpis: {
      geoScore,
      averageRank: summary.averageRank ?? null,
      averagePosition: summary.averagePosition ?? null,
      totalMentions: summary.totalMentions ?? 0,
      totalSources: summary.totalSources ?? 0,
      shareOfVoice,
      brandCoverage,
      domainCoverage,
      totalPrompts: stats?.totalPrompts ?? promptItems.length,
      totalCitations: citationItems.length,
      totalRecommendations: recommendationItems.length,
      totalAiResponseGroups: responseGroups.length
    },
    detectedBrands: stats?.detectedBrands || [],
    brandAnalysis: stats?.allBrandsAnalysis || {},
    citations: citationItems,
    citationStats,
    prompts: promptItems,
    aiResponses: responseGroups,
    recommendations: recommendationItems,
    audits: {
      crawlability: crawlability?.items || [],
      content: content?.items || []
    },
    accountInfo,
    cortexyInsights: buildCortexyInsights({ report, stats, citations: citationItems, prompts: promptItems, recommendations: recommendationItems })
  };
}

function buildCortexyInsights({ report, stats, citations, prompts, recommendations }) {
  const summary = stats?.summary || {};
  const insights = [];
  const brandName = report?.brand || "the tracked brand";
  const brandDomain = report?.brandDomain;
  const competitorNames = new Set((report?.competitors || []).map((item) => item.brand).filter(Boolean));
  const competitorCitationOpportunities = citations
    .filter((citation) => !citation.isMyBrandDomain && citation.competitors?.some((item) => competitorNames.has(item.brand || item)))
    .slice(0, 10);

  if (Number(summary.brandCoverage || 0) < 50) {
    insights.push({
      type: "brand-coverage",
      priority: "high",
      title: "Increase brand coverage",
      detail: `Your brand is missing from too many tracked AI answers. Prioritize prompts where competitors are mentioned and ${brandName} is absent.`
    });
  }

  if (Number(summary.domainCoverage || 0) < 35) {
    insights.push({
      type: "domain-coverage",
      priority: "high",
      title: "Improve website citation coverage",
      detail: `${brandDomain || "The client domain"} is not being cited often enough. Build content around prompts with high competitor citation activity.`
    });
  }

  if (competitorCitationOpportunities.length) {
    insights.push({
      type: "competitor-citation-gap",
      priority: "medium",
      title: "Competitor citation gap found",
      detail: `${competitorCitationOpportunities.length} cited sources mention competitors or competitor domains. These are outreach/content partnership opportunities.`,
      items: competitorCitationOpportunities
    });
  }

  const topRecommendations = [...recommendations]
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
    .slice(0, 5);
  if (topRecommendations.length) {
    insights.push({
      type: "otterly-recommendations",
      priority: "medium",
      title: "Convert Otterly recommendations into tasks",
      detail: "The highest priority Otterly recommendations should become Cortexy implementation tasks.",
      items: topRecommendations
    });
  }

  if (!prompts.length) {
    insights.push({
      type: "prompt-setup",
      priority: "high",
      title: "No prompt data synced yet",
      detail: "Add prompts in Otterly or wait for Otterly to complete the first run, then sync again."
    });
  }

  return insights;
}

function otterlyBundleToDashboardRecords(bundle) {
  const summary = bundle.summary?.summary || {};
  const timestamp = new Date().toISOString();
  const baseRaw = {
    provider: "otterly",
    workspaceId: bundle.workspaceId,
    reportId: bundle.reportId,
    country: bundle.country,
    startDate: bundle.startDate,
    endDate: bundle.endDate
  };

  return [
    {
      sourceId: `otterly:${bundle.reportId}:brand-coverage`,
      title: "Brand coverage",
      metric: Number(summary.brandCoverage || 0),
      status: Number(summary.brandCoverage || 0) >= 50 ? "healthy" : "attention",
      occurredAt: timestamp,
      raw: { ...baseRaw, summary }
    },
    {
      sourceId: `otterly:${bundle.reportId}:domain-coverage`,
      title: "Domain coverage",
      metric: Number(summary.domainCoverage || 0),
      status: Number(summary.domainCoverage || 0) >= 35 ? "healthy" : "attention",
      occurredAt: timestamp,
      raw: { ...baseRaw, summary }
    },
    {
      sourceId: `otterly:${bundle.reportId}:share-of-voice`,
      title: "Share of voice",
      metric: Number(summary.shareOfVoice || 0),
      status: Number(summary.shareOfVoice || 0) >= 20 ? "healthy" : "attention",
      occurredAt: timestamp,
      raw: { ...baseRaw, summary }
    },
    {
      sourceId: `otterly:${bundle.reportId}:recommendations`,
      title: "Open optimization recommendations",
      metric: Number(bundle.summary?.totalRecommendations || 0),
      status: Number(bundle.summary?.totalRecommendations || 0) ? "attention" : "healthy",
      occurredAt: timestamp,
      raw: { ...baseRaw, summary: bundle.summary }
    }
  ];
}
