import { config } from "./config.js";

const DEFAULT_LIMIT = 100;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultDateWindow() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

function appendParams(url, params = {}) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
}

export class OtterlyApiClient {
  constructor({ apiKey, baseUrl = config.otterlyApiUrl } = {}) {
    this.apiKey = apiKey || config.otterlyApiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(path, params = {}, options = {}) {
    if (!this.apiKey) {
      throw new Error("Otterly API key is required");
    }

    const url = new URL(path, this.baseUrl);
    appendParams(url, params);

    const response = await fetch(url.toString(), {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });

    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      const error = new Error(payload.message || `Otterly API failed with ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async requestCursorPages(path, params = {}) {
    const items = [];
    let cursor = params.cursor;
    let paging = null;

    do {
      const payload = await this.request(path, { ...params, cursor });
      if (Array.isArray(payload.items)) items.push(...payload.items);
      paging = payload.paging || null;
      cursor = paging?.hasMore ? paging.nextCursor : null;
    } while (cursor);

    return { items, paging: paging || { nextCursor: null, hasMore: false } };
  }

  async requestOffsetPages(path, params = {}) {
    const items = [];
    let offset = Number(params.offset || 0);
    const limit = Number(params.limit || DEFAULT_LIMIT);
    let paging = null;

    while (true) {
      const payload = await this.request(path, { ...params, offset, limit });
      const pageItems = Array.isArray(payload.items) ? payload.items : [];
      items.push(...pageItems);
      paging = payload.paging || null;

      if (!pageItems.length || pageItems.length < limit) break;
      if (paging && paging.total !== undefined && items.length >= Number(paging.total)) break;
      offset += limit;
    }

    return { items, paging: paging || { offset: 0, limit, total: items.length } };
  }

  listEngines(params = {}) {
    return this.request("/v1/engines", params);
  }

  listWorkspaces() {
    return this.requestCursorPages("/v1/workspaces");
  }

  listWorkspaceTags(workspaceId) {
    return this.requestCursorPages(`/v1/workspaces/${workspaceId}/tags`);
  }

  listBrandReports(workspaceId) {
    return this.requestCursorPages("/v1/reports/brand", { workspaceId });
  }

  getBrandReport(reportId) {
    return this.request(`/v1/reports/brand/${reportId}`);
  }

  getBrandReportStats(reportId, params) {
    return this.request(`/v1/reports/brand/${reportId}/stats`, params);
  }

  listCitations(reportId, params) {
    return this.requestOffsetPages(`/v1/reports/brand/${reportId}/citations`, params);
  }

  getCitationStats(reportId, params) {
    return this.request(`/v1/reports/brand/${reportId}/citations/stats`, params);
  }

  listCitationPrompts(reportId, params) {
    return this.request(`/v1/reports/brand/${reportId}/citations/prompts`, params);
  }

  listPrompts(reportId, params) {
    return this.requestOffsetPages(`/v1/reports/brand/${reportId}/prompts`, params);
  }

  getPrompt(reportId, promptId, params) {
    return this.request(`/v1/reports/brand/${reportId}/prompts/${promptId}`, params);
  }

  listPromptAiResponses(reportId, promptId, params) {
    return this.requestCursorPages(`/v1/reports/brand/${reportId}/prompts/${promptId}/ai-responses`, params);
  }

  listRecommendations(reportId, params) {
    return this.requestCursorPages(`/v1/reports/brand/${reportId}/recommendations`, params);
  }

  listCrawlabilityChecks(workspaceId) {
    return this.requestCursorPages("/v1/audits/geo/crawlability-checks", { workspaceId });
  }

  createCrawlabilityCheck({ workspaceId, url }) {
    return this.request("/v1/audits/geo/crawlability-checks", {}, {
      method: "POST",
      body: { workspaceId, url }
    });
  }

  getCrawlabilityCheck(checkId) {
    return this.request(`/v1/audits/geo/crawlability-checks/${checkId}`);
  }

  listContentChecks(workspaceId) {
    return this.requestCursorPages("/v1/audits/geo/content-checks", { workspaceId });
  }

  createContentCheck({ workspaceId, url, crawlerIdentity, sendOtterlyHeader }) {
    return this.request("/v1/audits/geo/content-checks", {}, {
      method: "POST",
      body: {
        workspaceId,
        url,
        ...(crawlerIdentity ? { crawlerIdentity } : {}),
        ...(sendOtterlyHeader !== undefined ? { sendOtterlyHeader } : {})
      }
    });
  }

  getContentCheck(checkId) {
    return this.request(`/v1/audits/geo/content-checks/${checkId}`);
  }

  getAccountInfo() {
    return this.request("/v1/accounts/info");
  }
}

export async function fetchOtterlyBundle({
  apiKey,
  workspaceId,
  reportId,
  country,
  startDate,
  endDate,
  engines
}) {
  const client = new OtterlyApiClient({ apiKey });
  const dateWindow = {
    ...defaultDateWindow(),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {})
  };

  const resources = [];
  const add = (type, key, payload, meta = {}) => {
    resources.push({
      resourceType: type,
      resourceKey: key,
      payload,
      country: meta.country || country || null,
      engine: meta.engine || null
    });
  };

  const [enginesPayload, accountInfo, workspaces, reports, tags] = await Promise.all([
    client.listEngines(country ? { country } : {}),
    client.getAccountInfo(),
    client.listWorkspaces(),
    client.listBrandReports(workspaceId),
    client.listWorkspaceTags(workspaceId)
  ]);

  add("engines", "all", enginesPayload);
  add("account-info", "current", accountInfo);
  add("workspaces", "all", workspaces);
  add("brand-reports", workspaceId, reports);
  add("workspace-tags", workspaceId, tags);

  const report = await client.getBrandReport(reportId);
  const activeCountry = country || report.countries?.[0] || "us";
  const reportParams = { ...dateWindow, country: activeCountry, ...(engines?.length ? { engines } : {}) };
  add("brand-report", reportId, report, { country: activeCountry });

  const [stats, citations, citationStats, prompts, recommendations, crawlabilityChecks, contentChecks] = await Promise.all([
    client.getBrandReportStats(reportId, reportParams),
    client.listCitations(reportId, { ...reportParams, limit: DEFAULT_LIMIT }),
    client.getCitationStats(reportId, reportParams),
    client.listPrompts(reportId, { ...reportParams, limit: DEFAULT_LIMIT }),
    client.listRecommendations(reportId, { country: activeCountry }),
    client.listCrawlabilityChecks(workspaceId),
    client.listContentChecks(workspaceId)
  ]);

  add("brand-report-stats", `${reportId}:${activeCountry}`, stats, { country: activeCountry });
  add("citations", `${reportId}:${activeCountry}`, citations, { country: activeCountry });
  add("citation-stats", `${reportId}:${activeCountry}`, citationStats, { country: activeCountry });
  add("prompts", `${reportId}:${activeCountry}`, prompts, { country: activeCountry });
  add("recommendations", `${reportId}:${activeCountry}`, recommendations, { country: activeCountry });
  add("crawlability-checks", workspaceId, crawlabilityChecks);
  add("content-checks", workspaceId, contentChecks);

  const promptItems = prompts.items || [];
  const promptDetails = [];
  const aiResponses = [];
  for (const prompt of promptItems) {
    const promptId = prompt.id || prompt.promptId;
    if (!promptId) continue;
    const [detail, responses] = await Promise.all([
      client.getPrompt(reportId, promptId, reportParams),
      client.listPromptAiResponses(reportId, promptId, reportParams)
    ]);
    promptDetails.push(detail);
    aiResponses.push({ promptId, prompt: prompt.prompt || detail.prompt, ...responses });
  }
  add("prompt-details", `${reportId}:${activeCountry}`, { items: promptDetails }, { country: activeCountry });
  add("ai-responses", `${reportId}:${activeCountry}`, { items: aiResponses }, { country: activeCountry });

  const citationPromptItems = [];
  for (const citation of (citations.items || []).slice(0, 50)) {
    if (!citation.url) continue;
    const citationPrompts = await client.listCitationPrompts(reportId, { ...reportParams, url: citation.url });
    citationPromptItems.push({ url: citation.url, domain: citation.domain, ...citationPrompts });
  }
  add("citation-prompts", `${reportId}:${activeCountry}`, { items: citationPromptItems }, { country: activeCountry });

  const crawlabilityDetails = [];
  for (const check of crawlabilityChecks.items || []) {
    if (check.id) crawlabilityDetails.push(await client.getCrawlabilityCheck(check.id));
  }
  add("crawlability-details", workspaceId, { items: crawlabilityDetails });

  const contentDetails = [];
  for (const check of contentChecks.items || []) {
    if (check.id) contentDetails.push(await client.getContentCheck(check.id));
  }
  add("content-details", workspaceId, { items: contentDetails });

  return {
    workspaceId,
    reportId,
    country: activeCountry,
    startDate: dateWindow.startDate,
    endDate: dateWindow.endDate,
    resources,
    summary: buildOtterlySummary(resources)
  };
}

export function buildOtterlySummary(resources) {
  const byType = Object.fromEntries(resources.map((resource) => [resource.resourceType, resource.payload]));
  const stats = byType["brand-report-stats"];
  const report = byType["brand-report"];
  const prompts = byType.prompts;
  const citations = byType.citations;
  const recommendations = byType.recommendations;

  return {
    brand: report?.brand || null,
    brandDomain: report?.brandDomain || null,
    reportTitle: report?.reportTitle || report?.brand || null,
    countries: report?.countries || [],
    competitors: report?.competitors || [],
    totalPrompts: stats?.totalPrompts ?? prompts?.items?.length ?? 0,
    totalCitations: citations?.items?.length ?? 0,
    totalRecommendations: recommendations?.items?.length ?? 0,
    summary: stats?.summary || null,
    detectedBrands: stats?.detectedBrands || []
  };
}
