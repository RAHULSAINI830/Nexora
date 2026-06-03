import { config } from "./config.js";

export async function fetchExternalDashboardData(params = {}) {
  const apiUrl = config.externalApiUrl || "https://data.otterly.ai/v1/reports/brand";
  const apiKey = config.externalApiKey;

  if (!apiKey) {
    throw new Error("EXTERNAL_API_KEY is required to sync external dashboard data");
  }

  const url = new URL(apiUrl);
  if (params.accountId) {
    url.searchParams.append("workspaceId", params.accountId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`External API failed with ${response.status}`);
  }

  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : (payload.items || payload.data || []);

  if (!Array.isArray(records)) {
    throw new Error("External API response must be an array or contain an 'items' array");
  }

  return records.map((record, index) => ({
    sourceId: String(record.id ?? `external-${index}`),
    title: String(record.brand || record.reportTitle || "Untitled Brand Report"),
    metric: Number(record.competitors?.length ?? 0),
    status: "healthy",
    occurredAt: String(record.updatedDate || record.createdDate || new Date().toISOString()),
    raw: record
  }));
}
