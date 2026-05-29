import { config } from "./config.js";

const demoRecords = [
  {
    sourceId: "demo-001",
    title: "Active API Users",
    metric: 1240,
    status: "healthy",
    occurredAt: new Date().toISOString()
  },
  {
    sourceId: "demo-002",
    title: "Pending Reviews",
    metric: 37,
    status: "attention",
    occurredAt: new Date().toISOString()
  },
  {
    sourceId: "demo-003",
    title: "Monthly Revenue",
    metric: 84500,
    status: "healthy",
    occurredAt: new Date().toISOString()
  }
];

export async function fetchExternalDashboardData() {
  if (!config.externalApiUrl) {
    return demoRecords;
  }

  const response = await fetch(config.externalApiUrl, {
    headers: {
      Accept: "application/json",
      ...(config.externalApiKey ? { Authorization: `Bearer ${config.externalApiKey}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`External API failed with ${response.status}`);
  }

  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : payload.data;

  if (!Array.isArray(records)) {
    throw new Error("External API response must be an array or { data: [] }");
  }

  return records.map((record, index) => ({
    sourceId: String(record.id ?? record.sourceId ?? `external-${index}`),
    title: String(record.title ?? record.name ?? "Untitled metric"),
    metric: Number(record.metric ?? record.value ?? 0),
    status: String(record.status ?? "unknown"),
    occurredAt: String(record.occurredAt ?? record.createdAt ?? new Date().toISOString()),
    raw: record
  }));
}
