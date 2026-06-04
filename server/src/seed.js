import bcrypt from "bcryptjs";
import { store, resetDatabase } from "./db.js";

// Reset tables to clear old schema constraints and build fresh
console.log("Resetting database schema...");
await resetDatabase();

// 1. Seed Accounts
console.log("Seeding accounts...");
const demoAccount = await store.createAccount({
  name: "Stott Electrical Solutions",
  slug: "stott-electrical",
  tagline: "Expert Electrical Contracting Services",
  billingAddressLine1: "78 Sandringham Circle",
  billingAddressLine2: "",
  city: "Orangeville",
  state: "Ontario",
  country: "Canada",
  zipcode: "L9W0A6",
  administrator: "Joshua Stott",
  cellphone: "(519) 216-8200",
  timezone: "America/Toronto",
  locale: "en-CA",
  language: "English",
  currency: "CAD"
});


// 2. Seed Branches for Demo Account
console.log("Seeding branches...");
const northBranch = await store.createBranch({
  name: "North Branch (NYC)",
  accountId: demoAccount.id
});

const southBranch = await store.createBranch({
  name: "South Branch (Miami)",
  accountId: demoAccount.id
});

// 3. Seed Users (Keep only the developer user account)
console.log("Seeding users...");

// DEVELOPER (System Developer)
await store.createUser({
  email: "developer@cortexy.local",
  name: "Cortexy Developer (Dev)",
  passwordHash: await bcrypt.hash("developer123", 12),
  role: "DEVELOPER",
  accountId: null,
  emailVerifiedAt: new Date().toISOString()
});

// 4. Seed Dashboard Records for Demo Account
console.log("Seeding dashboard records...");
await store.upsertDashboardRecords(demoAccount.id, [
  {
    sourceId: "report-crm-sync",
    title: "HubSpot CRM Integration",
    metric: 98.4, // Sync Success Rate (%)
    status: "healthy",
    occurredAt: new Date().toISOString(),
    raw: { type: "crm", sync_count: 1420, errors: 0, api_status: "connected" }
  },
  {
    sourceId: "report-financials",
    title: "Monthly Recurring Revenue (MRR)",
    metric: 45200.0, // Revenue in USD
    status: "healthy",
    occurredAt: new Date(Date.now() - 3600000).toISOString(),
    raw: { currency: "USD", growth_rate_pct: 12.5, churn_rate_pct: 1.8 }
  },
  {
    sourceId: "report-ai-tone",
    title: "AI Auto-Reply Positive Sentiment",
    metric: 94.2, // Positive response percentage
    status: "healthy",
    occurredAt: new Date(Date.now() - 7200000).toISOString(),
    raw: { tone_profile: "Professional-Empathetic", total_replies: 582, customer_approvals: 548 }
  },
  {
    sourceId: "report-gbp-posts",
    title: "Google Business Profile Post Reach",
    metric: 890.0, // Impressions
    status: "healthy",
    occurredAt: new Date(Date.now() - 86400000).toISOString(),
    raw: { clicks: 124, post_title: "Summer Discount Specials", branch: "North Branch (NYC)" }
  },
  {
    sourceId: "report-tech-performance",
    title: "Average Job Completion Rating",
    metric: 4.85, // out of 5 stars
    status: "healthy",
    occurredAt: new Date(Date.now() - 172800000).toISOString(),
    raw: { total_reviews: 140, on_time_percentage: 97.2, average_time_mins: 42 }
  },
  {
    sourceId: "report-ops-efficiency",
    title: "Operational Idle Efficiency",
    metric: 82.5, // % optimal route / timing
    status: "attention",
    occurredAt: new Date(Date.now() - 259200000).toISOString(),
    raw: { traffic_delays_hrs: 4.5, route_optimization_score: 85 }
  }
]);

console.log("Database successfully seeded!");
