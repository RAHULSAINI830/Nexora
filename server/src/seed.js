import bcrypt from "bcryptjs";
import { store } from "./db.js";

const account = store.upsertAccount({
  name: "Demo Account",
  slug: "demo-account"
});

store.upsertUser({
  email: "developer@cortexy.local",
  name: "Cortexy Developer",
  passwordHash: await bcrypt.hash("developer123", 12),
  role: "DEVELOPER"
});

const admin = store.upsertUser({
  email: "admin@cortexy.local",
  name: "Demo Admin",
  passwordHash: await bcrypt.hash("admin123", 12),
  role: "ADMIN",
  accountId: account.id
});

store.upsertUser({
  email: "user@cortexy.local",
  name: "Demo User",
  passwordHash: await bcrypt.hash("user12345", 12),
  role: "USER",
  accountId: account.id,
  adminId: admin.id
});

console.log("Seeded demo account, developer, admin, and user.");
