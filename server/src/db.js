import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { config } from "./config.js";

let databaseConfigError = null;

if (Boolean(config.tursoDatabaseUrl) !== Boolean(config.tursoAuthToken)) {
  databaseConfigError = new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured together");
}

if (process.env.VERCEL && !config.tursoDatabaseUrl) {
  databaseConfigError = new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required on Vercel");
}

if (config.tursoDatabaseUrl && !config.tursoDatabaseUrl.startsWith("libsql://")) {
  databaseConfigError = new Error("TURSO_DATABASE_URL must start with libsql://");
}

const localDatabasePath = resolve(config.databaseFile);
if (!config.tursoDatabaseUrl) {
  mkdirSync(dirname(localDatabasePath), { recursive: true });
}

export const db = databaseConfigError
  ? null
  : createClient({
      url: config.tursoDatabaseUrl || `file:${localDatabasePath}`,
      authToken: config.tursoAuthToken || undefined
    });

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    billing_address_line1 TEXT,
    billing_address_line2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    zipcode TEXT,
    administrator TEXT,
    cellphone TEXT,
    timezone TEXT,
    locale TEXT,
    language TEXT,
    currency TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
      'DEVELOPER', 'SUPER_ADMIN', 'BUSINESS_OWNER', 'MARKETING_MANAGER',
      'OPERATIONS_MANAGER', 'BRANCH_MANAGER', 'TECHNICIAN', 'ANALYST'
    )),
    account_id TEXT,
    admin_id TEXT,
    branch_id TEXT,
    email_verified_at TEXT,
    email_verification_method TEXT,
    email_verified_by_user_id TEXT,
    verification_code_hash TEXT,
    verification_code_expires_at TEXT,
    verification_sent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (email_verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS dashboard_records (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    metric REAL NOT NULL,
    status TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    raw TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (account_id, source_id),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS account_integrations (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    platform_key TEXT NOT NULL,
    platform_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected')),
    config TEXT NOT NULL,
    connected_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (account_id, platform_key),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS otterly_resources (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    report_id TEXT,
    resource_type TEXT NOT NULL,
    resource_key TEXT NOT NULL,
    country TEXT,
    engine TEXT,
    payload TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (account_id, resource_type, resource_key),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS otterly_sync_runs (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    report_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    started_at TEXT NOT NULL,
    completed_at TEXT,
    error TEXT,
    summary TEXT NOT NULL,
    created_by_user_id TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_id TEXT,
    action TEXT NOT NULL,
    method TEXT,
    path TEXT,
    status_code INTEGER,
    metadata TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS dashboard_records_account_time_idx
    ON dashboard_records(account_id, occurred_at)`,
  `CREATE INDEX IF NOT EXISTS otterly_resources_account_type_idx
    ON otterly_resources(account_id, resource_type, updated_at)`,
  `CREATE INDEX IF NOT EXISTS otterly_sync_runs_account_time_idx
    ON otterly_sync_runs(account_id, started_at)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_user_time_idx
    ON audit_logs(user_id, created_at)`
];

let initializationPromise;

export function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = initializeSchema().then(() => bootstrapDeveloper());
  }
  return initializationPromise;
}

async function initializeSchema() {
  if (databaseConfigError) {
    throw databaseConfigError;
  }

  await db.execute("PRAGMA foreign_keys = ON");
  for (const sql of schemaStatements) {
    await db.execute(sql);
  }
  await runMigrations();
}

async function runMigrations() {
  await db.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const migrationId = "2026-06-04-email-verification";
  const existing = await db.execute({
    sql: "SELECT id FROM schema_migrations WHERE id = ?",
    args: [migrationId]
  });
  if (!existing.rows.length) {
    const columns = await db.execute("PRAGMA table_info(users)");
    const columnNames = new Set(columns.rows.map((column) => column.name));
    for (const [name, type] of [
      ["email_verified_at", "TEXT"],
      ["verification_code_hash", "TEXT"],
      ["verification_code_expires_at", "TEXT"],
      ["verification_sent_at", "TEXT"]
    ]) {
      if (!columnNames.has(name)) {
        await db.execute(`ALTER TABLE users ADD COLUMN ${name} ${type}`);
      }
    }

    const timestamp = now();
    await db.execute({
      sql: "UPDATE users SET email_verified_at = ? WHERE email_verified_at IS NULL",
      args: [timestamp]
    });
    await db.execute({
      sql: "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: [migrationId, timestamp]
    });
  }

  const accountProfileMigrationId = "2026-06-16-account-profile-columns";
  const accountProfileExisting = await db.execute({
    sql: "SELECT id FROM schema_migrations WHERE id = ?",
    args: [accountProfileMigrationId]
  });
  if (!accountProfileExisting.rows.length) {
    const columns = await db.execute("PRAGMA table_info(accounts)");
    const columnNames = new Set(columns.rows.map((column) => column.name));
    for (const [name, type] of [
      ["tagline", "TEXT"],
      ["billing_address_line1", "TEXT"],
      ["billing_address_line2", "TEXT"],
      ["city", "TEXT"],
      ["state", "TEXT"],
      ["country", "TEXT"],
      ["zipcode", "TEXT"],
      ["administrator", "TEXT"],
      ["cellphone", "TEXT"],
      ["timezone", "TEXT"],
      ["locale", "TEXT"],
      ["language", "TEXT"],
      ["currency", "TEXT"]
    ]) {
      if (!columnNames.has(name)) {
        await db.execute(`ALTER TABLE accounts ADD COLUMN ${name} ${type}`);
      }
    }
    await db.execute({
      sql: "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: [accountProfileMigrationId, now()]
    });
  }

  const auditMigrationId = "2026-06-04-email-verification-audit";
  const auditExisting = await db.execute({
    sql: "SELECT id FROM schema_migrations WHERE id = ?",
    args: [auditMigrationId]
  });
  if (!auditExisting.rows.length) {
    const auditColumns = await db.execute("PRAGMA table_info(users)");
    const auditColumnNames = new Set(auditColumns.rows.map((column) => column.name));
    for (const [name, type] of [
      ["email_verification_method", "TEXT"],
      ["email_verified_by_user_id", "TEXT"]
    ]) {
      if (!auditColumnNames.has(name)) {
        await db.execute(`ALTER TABLE users ADD COLUMN ${name} ${type}`);
      }
    }

    const auditTimestamp = now();
    await db.execute("UPDATE users SET email_verification_method = 'system' WHERE email_verified_at IS NOT NULL AND email_verification_method IS NULL");
    await db.execute({
      sql: "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: [auditMigrationId, auditTimestamp]
    });
  }

  const otterlyMigrationId = "2026-06-16-otterly-cache";
  const otterlyExisting = await db.execute({
    sql: "SELECT id FROM schema_migrations WHERE id = ?",
    args: [otterlyMigrationId]
  });
  if (!otterlyExisting.rows.length) {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS otterly_resources (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        report_id TEXT,
        resource_type TEXT NOT NULL,
        resource_key TEXT NOT NULL,
        country TEXT,
        engine TEXT,
        payload TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (account_id, resource_type, resource_key),
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS otterly_sync_runs (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        report_id TEXT,
        status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
        started_at TEXT NOT NULL,
        completed_at TEXT,
        error TEXT,
        summary TEXT NOT NULL,
        created_by_user_id TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
      `CREATE INDEX IF NOT EXISTS otterly_resources_account_type_idx
        ON otterly_resources(account_id, resource_type, updated_at)`,
      `CREATE INDEX IF NOT EXISTS otterly_sync_runs_account_time_idx
        ON otterly_sync_runs(account_id, started_at)`,
      `INSERT INTO schema_migrations (id, applied_at) VALUES ('${otterlyMigrationId}', '${now()}')`
    ].map((sql) => ({ sql, args: [] })), "write");
  }
}

async function execute(sql, args = []) {
  await initializeDatabase();
  return db.execute({ sql, args });
}

async function first(sql, args = []) {
  const result = await execute(sql, args);
  return result.rows[0] ?? null;
}

function now() {
  return new Date().toISOString();
}

function mapAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    billingAddressLine1: row.billing_address_line1,
    billingAddressLine2: row.billing_address_line2,
    city: row.city,
    state: row.state,
    country: row.country,
    zipcode: row.zipcode,
    administrator: row.administrator,
    cellphone: row.cellphone,
    timezone: row.timezone,
    locale: row.locale,
    language: row.language,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    accountId: row.account_id,
    adminId: row.admin_id,
    branchId: row.branch_id,
    emailVerifiedAt: row.email_verified_at,
    emailVerified: Boolean(row.email_verified_at),
    emailVerificationMethod: row.email_verification_method,
    emailVerifiedByUserId: row.email_verified_by_user_id,
    emailVerifiedBy: row.email_verified_by_user_id
      ? { id: row.email_verified_by_user_id, name: row.verifier_name, email: row.verifier_email }
      : null,
    verificationCodeHash: row.verification_code_hash,
    verificationCodeExpiresAt: row.verification_code_expires_at,
    verificationSentAt: row.verification_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    account: row.account_id ? { id: row.account_id, name: row.account_name, slug: row.account_slug } : null,
    admin: row.admin_id ? { id: row.admin_id, name: row.admin_name, email: row.admin_email } : null,
    branch: row.branch_id ? { id: row.branch_id, name: row.branch_name } : null
  };
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, verificationCodeHash, verificationCodeExpiresAt, ...safeUser } = user;
  return safeUser;
}

function mapRecord(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    sourceId: row.source_id,
    title: row.title,
    metric: row.metric,
    status: row.status,
    occurredAt: row.occurred_at,
    raw: row.raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    account: { id: row.account_id, name: row.account_name, slug: row.account_slug }
  };
}

function mapIntegration(row) {
  if (!row) return null;
  let parsedConfig = {};
  try {
    parsedConfig = JSON.parse(row.config || "{}");
  } catch {
    parsedConfig = {};
  }
  if (parsedConfig.apiKey) {
    parsedConfig = { ...parsedConfig, apiKey: "********" };
  }
  return {
    id: row.id,
    accountId: row.account_id,
    platformKey: row.platform_key,
    platformName: row.platform_name,
    status: row.status,
    config: parsedConfig,
    connectedAt: row.connected_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapOtterlyResource(row) {
  if (!row) return null;
  let payload = {};
  try {
    payload = JSON.parse(row.payload || "{}");
  } catch {
    payload = {};
  }
  return {
    id: row.id,
    accountId: row.account_id,
    workspaceId: row.workspace_id,
    reportId: row.report_id,
    resourceType: row.resource_type,
    resourceKey: row.resource_key,
    country: row.country,
    engine: row.engine,
    payload,
    fetchedAt: row.fetched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapOtterlySyncRun(row) {
  if (!row) return null;
  let summary = {};
  try {
    summary = JSON.parse(row.summary || "{}");
  } catch {
    summary = {};
  }
  return {
    id: row.id,
    accountId: row.account_id,
    workspaceId: row.workspace_id,
    reportId: row.report_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    error: row.error,
    summary,
    createdByUserId: row.created_by_user_id
  };
}

function mapAuditLog(row) {
  let metadata = {};
  try {
    metadata = JSON.parse(row.metadata || "{}");
  } catch {
    metadata = {};
  }

  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    action: row.action,
    method: row.method,
    path: row.path,
    statusCode: row.status_code,
    metadata,
    createdAt: row.created_at
  };
}

const userSelect = `
  SELECT users.*, accounts.name AS account_name, accounts.slug AS account_slug,
    admins.name AS admin_name, admins.email AS admin_email, branches.name AS branch_name,
    verifiers.name AS verifier_name, verifiers.email AS verifier_email
  FROM users
  LEFT JOIN accounts ON accounts.id = users.account_id
  LEFT JOIN users admins ON admins.id = users.admin_id
  LEFT JOIN branches ON branches.id = users.branch_id
  LEFT JOIN users verifiers ON verifiers.id = users.email_verified_by_user_id
`;

export const INTEGRATION_PLATFORMS = [
  { key: "otterly", name: "OtterlyAI" },
  { key: "servicetitan", name: "ServiceTitan" },
  { key: "housecall", name: "Housecall Pro" },
  { key: "servicetrade", name: "ServiceTrade" },
  { key: "jobber", name: "Jobber" }
];

export const store = {
  async upsertAccount({ id, name, slug }) {
    const existing = id ? await this.findAccountById(id) : mapAccount(await first("SELECT * FROM accounts WHERE slug = ?", [slug]));
    return existing || this.createAccount({ id, name, slug });
  },

  async createAccount(data) {
    const timestamp = now();
    const account = {
      id: data.id || randomUUID(), name: data.name, slug: data.slug, tagline: data.tagline || "",
      billing_address_line1: data.billingAddressLine1 || "", billing_address_line2: data.billingAddressLine2 || "",
      city: data.city || "", state: data.state || "", country: data.country || "", zipcode: data.zipcode || "",
      administrator: data.administrator || "", cellphone: data.cellphone || "", timezone: data.timezone || "UTC",
      locale: data.locale || "en-US", language: data.language || "English", currency: data.currency || "USD",
      created_at: timestamp, updated_at: timestamp
    };
    await execute(
      `INSERT INTO accounts (
        id, name, slug, tagline, billing_address_line1, billing_address_line2, city, state, country, zipcode,
        administrator, cellphone, timezone, locale, language, currency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(account)
    );
    await this.ensureDefaultIntegrations(account.id);
    return mapAccount(account);
  },

  async updateAccount(id, data) {
    if (!await this.findAccountById(id)) return null;
    await execute(
      `UPDATE accounts SET name = COALESCE(?, name), slug = COALESCE(?, slug), tagline = COALESCE(?, tagline),
        billing_address_line1 = COALESCE(?, billing_address_line1), billing_address_line2 = COALESCE(?, billing_address_line2),
        city = COALESCE(?, city), state = COALESCE(?, state), country = COALESCE(?, country), zipcode = COALESCE(?, zipcode),
        administrator = COALESCE(?, administrator), cellphone = COALESCE(?, cellphone), timezone = COALESCE(?, timezone),
        locale = COALESCE(?, locale), language = COALESCE(?, language), currency = COALESCE(?, currency), updated_at = ? WHERE id = ?`,
      [data.name ?? null, data.slug ?? null, data.tagline ?? null, data.billingAddressLine1 ?? null,
        data.billingAddressLine2 ?? null, data.city ?? null, data.state ?? null, data.country ?? null, data.zipcode ?? null,
        data.administrator ?? null, data.cellphone ?? null, data.timezone ?? null, data.locale ?? null, data.language ?? null,
        data.currency ?? null, now(), id]
    );
    return this.findAccountById(id);
  },

  async findAccountById(id) {
    return mapAccount(await first("SELECT * FROM accounts WHERE id = ?", [id]));
  },

  async findAccountBySlug(slug) {
    return mapAccount(await first("SELECT * FROM accounts WHERE slug = ?", [slug]));
  },

  async listAccounts() {
    const result = await execute(`SELECT accounts.*, COUNT(DISTINCT users.id) AS users_count,
      COUNT(DISTINCT dashboard_records.id) AS records_count FROM accounts
      LEFT JOIN users ON users.account_id = accounts.id
      LEFT JOIN dashboard_records ON dashboard_records.account_id = accounts.id
      GROUP BY accounts.id ORDER BY accounts.created_at DESC`);
    return result.rows.map((row) => ({ ...mapAccount(row), _count: { users: row.users_count, records: row.records_count } }));
  },

  async countUsers() {
    return Number((await first("SELECT COUNT(*) AS count FROM users")).count);
  },

  async findUserByEmail(email) {
    return mapUser(await first(`${userSelect} WHERE users.email = ?`, [email]));
  },

  async findUserById(id) {
    return mapUser(await first(`${userSelect} WHERE users.id = ?`, [id]));
  },

  async upsertUser(data) {
    return (await this.findUserByEmail(data.email)) || this.createUser(data);
  },

  async createUser({
    id, email, name, passwordHash, role, accountId = null, adminId = null, branchId = null,
    emailVerifiedAt = null, emailVerificationMethod = emailVerifiedAt ? "system" : null
  }) {
    const timestamp = now();
    const finalId = id || randomUUID();
    await execute(`INSERT INTO users (
      id, email, name, password_hash, role, account_id, admin_id, branch_id,
      email_verified_at, email_verification_method, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [finalId, email, name, passwordHash, role, accountId, adminId, branchId,
      emailVerifiedAt, emailVerificationMethod, timestamp, timestamp]);
    return this.findUserById(finalId);
  },

  async setVerificationCode(id, { codeHash, expiresAt }) {
    await execute(`UPDATE users SET verification_code_hash = ?, verification_code_expires_at = ?,
      verification_sent_at = ?, updated_at = ? WHERE id = ?`,
    [codeHash, expiresAt, now(), now(), id]);
  },

  async markEmailVerified(id, { method = "otp", verifiedByUserId = null } = {}) {
    const timestamp = now();
    await execute(`UPDATE users SET email_verified_at = ?, email_verification_method = ?,
      email_verified_by_user_id = ?, verification_code_hash = NULL,
      verification_code_expires_at = NULL, updated_at = ? WHERE id = ?`,
    [timestamp, method, verifiedByUserId, timestamp, id]);
    return this.findUserById(id);
  },

  async clearEmailVerification(id) {
    await execute(`UPDATE users SET email_verified_at = NULL, email_verification_method = NULL,
      email_verified_by_user_id = NULL, verification_code_hash = NULL,
      verification_code_expires_at = NULL, verification_sent_at = NULL, updated_at = ? WHERE id = ?`,
    [now(), id]);
  },

  async updateUser(id, { email, name, passwordHash, role, accountId, adminId, branchId }) {
    if (!await this.findUserById(id)) return null;
    await execute(`UPDATE users SET email = COALESCE(?, email), name = COALESCE(?, name), password_hash = COALESCE(?, password_hash),
      role = COALESCE(?, role), account_id = COALESCE(?, account_id), admin_id = COALESCE(?, admin_id),
      branch_id = COALESCE(?, branch_id), updated_at = ? WHERE id = ?`,
    [email ?? null, name ?? null, passwordHash ?? null, role ?? null, accountId !== undefined ? accountId : null,
      adminId !== undefined ? adminId : null, branchId !== undefined ? branchId : null, now(), id]);
    return this.findUserById(id);
  },

  async listUsers({ accountId, adminId, role, branchId } = {}) {
    const filters = [];
    const args = [];
    for (const [column, value] of [["account_id", accountId], ["admin_id", adminId], ["role", role], ["branch_id", branchId]]) {
      if (value) {
        filters.push(`users.${column} = ?`);
        args.push(value);
      }
    }
    const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const result = await execute(`${userSelect}${where} ORDER BY users.created_at DESC`, args);
    return result.rows.map(mapUser).map(publicUser);
  },

  async listAdmins({ accountId } = {}) {
    return this.listUsers({ accountId, role: "BUSINESS_OWNER" });
  },

  async createAuditLog({ userId, accountId = null, action, method = null, path = null, statusCode = null, metadata = {} }) {
    if (!userId || !action) return;
    await execute(`INSERT INTO audit_logs (
      id, user_id, account_id, action, method, path, status_code, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), userId, accountId, action, method, path, statusCode, JSON.stringify(metadata), now()]);
  },

  async listAuditLogs(userId, limit = 100) {
    const result = await execute(
      "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [userId, limit]
    );
    return result.rows.map(mapAuditLog);
  },

  async deleteUser(id) {
    return (await execute("DELETE FROM users WHERE id = ?", [id])).rowsAffected > 0;
  },

  async deleteAccount(id) {
    await execute("DELETE FROM users WHERE account_id = ?", [id]);
    return (await execute("DELETE FROM accounts WHERE id = ?", [id])).rowsAffected > 0;
  },

  async createBranch({ id, name, accountId }) {
    const timestamp = now();
    const finalId = id || randomUUID();
    await execute("INSERT INTO branches (id, name, account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [finalId, name, accountId, timestamp, timestamp]);
    return { id: finalId, name, accountId };
  },

  async listBranches(accountId) {
    const result = accountId
      ? await execute("SELECT * FROM branches WHERE account_id = ? ORDER BY name ASC", [accountId])
      : await execute("SELECT * FROM branches ORDER BY name ASC");
    return result.rows;
  },

  async findBranchById(id) {
    return first("SELECT * FROM branches WHERE id = ?", [id]);
  },

  async ensureDefaultIntegrations(accountId) {
    if (!accountId) return;
    await initializeDatabase();
    const timestamp = now();
    await db.batch(INTEGRATION_PLATFORMS.map((platform) => ({
      sql: `INSERT INTO account_integrations (
        id, account_id, platform_key, platform_name, status, config, connected_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'disconnected', '{}', NULL, ?, ?) ON CONFLICT(account_id, platform_key) DO NOTHING`,
      args: [randomUUID(), accountId, platform.key, platform.name, timestamp, timestamp]
    })), "write");
  },

  async listAccountIntegrations(accountId) {
    await this.ensureDefaultIntegrations(accountId);
    const result = await execute("SELECT * FROM account_integrations WHERE account_id = ? ORDER BY platform_name ASC", [accountId]);
    return result.rows.map(mapIntegration);
  },

  async getAccountIntegration(accountId, platformKey) {
    await this.ensureDefaultIntegrations(accountId);
    return mapIntegration(await first("SELECT * FROM account_integrations WHERE account_id = ? AND platform_key = ?", [accountId, platformKey]));
  },

  async getAccountIntegrationRawConfig(accountId, platformKey) {
    await this.ensureDefaultIntegrations(accountId);
    const row = await first("SELECT config FROM account_integrations WHERE account_id = ? AND platform_key = ?", [accountId, platformKey]);
    if (!row) return {};
    try {
      return JSON.parse(row.config || "{}");
    } catch {
      return {};
    }
  },

  async findOtterlyWorkspaceAssignment(workspaceId, excludeAccountId = null) {
    const result = await execute(`SELECT account_integrations.account_id, account_integrations.config,
      accounts.name AS account_name, accounts.slug AS account_slug
      FROM account_integrations JOIN accounts ON accounts.id = account_integrations.account_id
      WHERE account_integrations.platform_key = 'otterly' AND account_integrations.status = 'connected'`);
    for (const row of result.rows) {
      if (excludeAccountId && row.account_id === excludeAccountId) continue;
      try {
        const integrationConfig = JSON.parse(row.config || "{}");
        if (integrationConfig.workspaceId === workspaceId) {
          return {
            accountId: row.account_id,
            accountName: row.account_name,
            accountSlug: row.account_slug,
            workspaceId
          };
        }
      } catch {
        // Ignore malformed legacy integration config.
      }
    }
    return null;
  },

  async setAccountIntegration(accountId, platformKey, { status, config: integrationConfig = {} }) {
    if (!INTEGRATION_PLATFORMS.some((item) => item.key === platformKey)) return null;
    await this.ensureDefaultIntegrations(accountId);
    const timestamp = now();
    await execute(`UPDATE account_integrations SET status = ?, config = ?, connected_at = ?, updated_at = ?
      WHERE account_id = ? AND platform_key = ?`,
    [status, JSON.stringify(integrationConfig), status === "connected" ? timestamp : null, timestamp, accountId, platformKey]);
    return mapIntegration(await first("SELECT * FROM account_integrations WHERE account_id = ? AND platform_key = ?", [accountId, platformKey]));
  },

  async listDashboardRecords({ accountId } = {}) {
    const where = accountId ? " WHERE dashboard_records.account_id = ?" : "";
    const result = await execute(`SELECT dashboard_records.*, accounts.name AS account_name, accounts.slug AS account_slug
      FROM dashboard_records JOIN accounts ON accounts.id = dashboard_records.account_id${where}
      ORDER BY occurred_at DESC LIMIT 100`, accountId ? [accountId] : []);
    return result.rows.map(mapRecord);
  },

  async upsertDashboardRecords(accountId, records) {
    await initializeDatabase();
    await db.batch(records.map((record) => {
      const timestamp = now();
      return {
        sql: `INSERT INTO dashboard_records (
          id, account_id, source_id, title, metric, status, occurred_at, raw, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_id, source_id) DO UPDATE SET title = excluded.title, metric = excluded.metric,
          status = excluded.status, occurred_at = excluded.occurred_at, raw = excluded.raw, updated_at = excluded.updated_at`,
        args: [randomUUID(), accountId, record.sourceId, record.title, record.metric, record.status,
          new Date(record.occurredAt).toISOString(), JSON.stringify(record.raw ?? record), timestamp, timestamp]
      };
    }), "write");
    return records.length;
  },

  async createOtterlySyncRun({ accountId, workspaceId, reportId, createdByUserId = null, summary = {} }) {
    const id = randomUUID();
    const timestamp = now();
    await execute(`INSERT INTO otterly_sync_runs (
      id, account_id, workspace_id, report_id, status, started_at, summary, created_by_user_id
    ) VALUES (?, ?, ?, ?, 'running', ?, ?, ?)`,
    [id, accountId, workspaceId, reportId, timestamp, JSON.stringify(summary), createdByUserId]);
    return this.findOtterlySyncRun(id);
  },

  async finishOtterlySyncRun(id, { status, error = null, summary = {} }) {
    await execute(`UPDATE otterly_sync_runs SET status = ?, completed_at = ?, error = ?, summary = ? WHERE id = ?`,
      [status, now(), error, JSON.stringify(summary), id]);
    return this.findOtterlySyncRun(id);
  },

  async findOtterlySyncRun(id) {
    return mapOtterlySyncRun(await first("SELECT * FROM otterly_sync_runs WHERE id = ?", [id]));
  },

  async latestOtterlySyncRun(accountId) {
    return mapOtterlySyncRun(await first("SELECT * FROM otterly_sync_runs WHERE account_id = ? ORDER BY started_at DESC LIMIT 1", [accountId]));
  },

  async upsertOtterlyResources(accountId, { workspaceId, reportId, resources }) {
    if (!resources.length) return 0;
    await initializeDatabase();
    const timestamp = now();
    await db.batch(resources.map((resource) => ({
      sql: `INSERT INTO otterly_resources (
        id, account_id, workspace_id, report_id, resource_type, resource_key, country, engine, payload, fetched_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, resource_type, resource_key) DO UPDATE SET
        workspace_id = excluded.workspace_id,
        report_id = excluded.report_id,
        country = excluded.country,
        engine = excluded.engine,
        payload = excluded.payload,
        fetched_at = excluded.fetched_at,
        updated_at = excluded.updated_at`,
      args: [
        randomUUID(),
        accountId,
        workspaceId,
        reportId || null,
        resource.resourceType,
        resource.resourceKey,
        resource.country || null,
        resource.engine || null,
        JSON.stringify(resource.payload || {}),
        timestamp,
        timestamp,
        timestamp
      ]
    })), "write");
    return resources.length;
  },

  async listOtterlyResources(accountId) {
    const result = await execute(
      "SELECT * FROM otterly_resources WHERE account_id = ? ORDER BY resource_type ASC, updated_at DESC",
      [accountId]
    );
    return result.rows.map(mapOtterlyResource);
  },

  async getOtterlyResourceMap(accountId) {
    const resources = await this.listOtterlyResources(accountId);
    return Object.fromEntries(resources.map((resource) => [resource.resourceType, resource]));
  }
};

export async function resetDatabase() {
  await initializeDatabase();
  await db.batch([
    "DROP TABLE IF EXISTS otterly_sync_runs", "DROP TABLE IF EXISTS otterly_resources", "DROP TABLE IF EXISTS audit_logs", "DROP TABLE IF EXISTS dashboard_records", "DROP TABLE IF EXISTS account_integrations", "DROP TABLE IF EXISTS users",
    "DROP TABLE IF EXISTS branches", "DROP TABLE IF EXISTS accounts"
  ].map((sql) => ({ sql, args: [] })), "write");
  initializationPromise = db.batch(schemaStatements.map((sql) => ({ sql, args: [] })), "write");
  await initializationPromise;
}

async function bootstrapDeveloper() {
  if (!config.bootstrapDeveloperEmail || !config.bootstrapDeveloperPassword) return;
  const result = await db.execute("SELECT COUNT(*) AS count FROM users");
  if (Number(result.rows[0].count) !== 0) return;
  const timestamp = now();
  await db.execute({
    sql: `INSERT INTO users (
      id, email, name, password_hash, role, account_id, admin_id, branch_id,
      email_verified_at, email_verification_method, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'DEVELOPER', NULL, NULL, NULL, ?, 'system', ?, ?)`,
    args: [randomUUID(), config.bootstrapDeveloperEmail, "Cortexy Developer",
      bcrypt.hashSync(config.bootstrapDeveloperPassword, 12), timestamp, timestamp, timestamp]
  });
}
