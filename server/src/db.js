import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import { config } from "./config.js";

const databasePath = resolve(config.databaseFile);
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");

// Standard Table Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
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
  );

  CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS dashboard_records (
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
  );

  CREATE TABLE IF NOT EXISTS account_integrations (
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
  );

  CREATE INDEX IF NOT EXISTS dashboard_records_account_time_idx
    ON dashboard_records(account_id, occurred_at);
`);

// Reset helper to reconstruct database with the new schema cleanly
export function resetDatabase() {
  db.exec("DROP TABLE IF EXISTS dashboard_records");
  db.exec("DROP TABLE IF EXISTS account_integrations");
  db.exec("DROP TABLE IF EXISTS users");
  db.exec("DROP TABLE IF EXISTS branches");
  db.exec("DROP TABLE IF EXISTS accounts");

  db.exec(`
    CREATE TABLE accounts (
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
    );

    CREATE TABLE branches (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE users (
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    CREATE TABLE dashboard_records (
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
    );

    CREATE TABLE account_integrations (
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
    );

    CREATE INDEX dashboard_records_account_time_idx
      ON dashboard_records(account_id, occurred_at);
  `);
}

const integrationColumns = db.prepare("PRAGMA table_info(account_integrations)").all();
if (!integrationColumns.length) {
  db.exec(`
    CREATE TABLE account_integrations (
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
    );
  `);
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    account: row.account_id
      ? {
          id: row.account_id,
          name: row.account_name,
          slug: row.account_slug
        }
      : null,
    admin: row.admin_id
      ? {
          id: row.admin_id,
          name: row.admin_name,
          email: row.admin_email
        }
      : null,
    branch: row.branch_id
      ? {
          id: row.branch_id,
          name: row.branch_name
        }
      : null
  };
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
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
    account: {
      id: row.account_id,
      name: row.account_name,
      slug: row.account_slug
    }
  };
}

export const INTEGRATION_PLATFORMS = [
  { key: "servicetitan", name: "ServiceTitan" },
  { key: "housecall", name: "Housecall Pro" },
  { key: "servicetrade", name: "ServiceTrade" },
  { key: "jobber", name: "Jobber" }
];

function mapIntegration(row) {
  if (!row) return null;
  let parsedConfig = {};
  try {
    parsedConfig = JSON.parse(row.config || "{}");
  } catch {
    parsedConfig = {};
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

export const store = {
  upsertAccount({ id, name, slug }) {
    if (id) {
      const existing = this.findAccountById(id);
      if (existing) return existing;
    } else {
      const existing = db.prepare("SELECT * FROM accounts WHERE slug = ?").get(slug);
      if (existing) return mapAccount(existing);
    }
    return this.createAccount({ id, name, slug });
  },

  createAccount(data) {
    const timestamp = now();
    const finalId = data.id || randomUUID();
    const account = {
      id: finalId,
      name: data.name,
      slug: data.slug,
      tagline: data.tagline || "",
      billing_address_line1: data.billingAddressLine1 || "",
      billing_address_line2: data.billingAddressLine2 || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      zipcode: data.zipcode || "",
      administrator: data.administrator || "",
      cellphone: data.cellphone || "",
      timezone: data.timezone || "UTC",
      locale: data.locale || "en-US",
      language: data.language || "English",
      currency: data.currency || "USD",
      created_at: timestamp,
      updated_at: timestamp
    };
    db.prepare(`
      INSERT INTO accounts (
        id, name, slug, tagline, billing_address_line1, billing_address_line2,
        city, state, country, zipcode, administrator, cellphone, timezone, locale, language, currency,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      account.id, account.name, account.slug, account.tagline, account.billing_address_line1, account.billing_address_line2,
      account.city, account.state, account.country, account.zipcode, account.administrator, account.cellphone,
      account.timezone, account.locale, account.language, account.currency,
      account.created_at, account.updated_at
    );
    const createdAccount = mapAccount(account);
    this.ensureDefaultIntegrations(createdAccount.id);
    return createdAccount;
  },

  updateAccount(id, data) {
    const timestamp = now();
    const existing = this.findAccountById(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE accounts SET 
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        tagline = COALESCE(?, tagline),
        billing_address_line1 = COALESCE(?, billing_address_line1),
        billing_address_line2 = COALESCE(?, billing_address_line2),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        country = COALESCE(?, country),
        zipcode = COALESCE(?, zipcode),
        administrator = COALESCE(?, administrator),
        cellphone = COALESCE(?, cellphone),
        timezone = COALESCE(?, timezone),
        locale = COALESCE(?, locale),
        language = COALESCE(?, language),
        currency = COALESCE(?, currency),
        updated_at = ?
      WHERE id = ?
    `).run(
      data.name ?? null, 
      data.slug ?? null, 
      data.tagline ?? null,
      data.billingAddressLine1 ?? null,
      data.billingAddressLine2 ?? null,
      data.city ?? null,
      data.state ?? null,
      data.country ?? null,
      data.zipcode ?? null,
      data.administrator ?? null,
      data.cellphone ?? null,
      data.timezone ?? null,
      data.locale ?? null,
      data.language ?? null,
      data.currency ?? null,
      timestamp, 
      id
    );

    return this.findAccountById(id);
  },

  findAccountById(id) {
    return mapAccount(db.prepare("SELECT * FROM accounts WHERE id = ?").get(id));
  },

  listAccounts() {
    return db
      .prepare(`
        SELECT
          accounts.*,
          COUNT(DISTINCT users.id) AS users_count,
          COUNT(DISTINCT dashboard_records.id) AS records_count
        FROM accounts
        LEFT JOIN users ON users.account_id = accounts.id
        LEFT JOIN dashboard_records ON dashboard_records.account_id = accounts.id
        GROUP BY accounts.id
        ORDER BY accounts.created_at DESC
      `)
      .all()
      .map((row) => ({
        ...mapAccount(row),
        _count: {
          users: row.users_count,
          records: row.records_count
        }
      }));
  },

  countUsers() {
    return db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  },

  findUserByEmail(email) {
    return mapUser(
      db
        .prepare(`
          SELECT
            users.*,
            accounts.name AS account_name,
            accounts.slug AS account_slug,
            admins.name AS admin_name,
            admins.email AS admin_email,
            branches.name AS branch_name
          FROM users
          LEFT JOIN accounts ON accounts.id = users.account_id
          LEFT JOIN users admins ON admins.id = users.admin_id
          LEFT JOIN branches ON branches.id = users.branch_id
          WHERE users.email = ?
        `)
        .get(email)
    );
  },

  findUserById(id) {
    return mapUser(
      db
        .prepare(`
          SELECT
            users.*,
            accounts.name AS account_name,
            accounts.slug AS account_slug,
            admins.name AS admin_name,
            admins.email AS admin_email,
            branches.name AS branch_name
          FROM users
          LEFT JOIN accounts ON accounts.id = users.account_id
          LEFT JOIN users admins ON admins.id = users.admin_id
          LEFT JOIN branches ON branches.id = users.branch_id
          WHERE users.id = ?
        `)
        .get(id)
    );
  },

  upsertUser({ email, name, passwordHash, role, accountId = null, adminId = null, branchId = null }) {
    const existing = this.findUserByEmail(email);
    if (existing) return existing;
    return this.createUser({ email, name, passwordHash, role, accountId, adminId, branchId });
  },

  createUser({ id, email, name, passwordHash, role, accountId = null, adminId = null, branchId = null }) {
    const timestamp = now();
    const finalId = id || randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role, account_id, admin_id, branch_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(finalId, email, name, passwordHash, role, accountId, adminId, branchId, timestamp, timestamp);
    return this.findUserById(finalId);
  },

  updateUser(id, { email, name, passwordHash, role, accountId, adminId, branchId }) {
    const timestamp = now();
    const existing = this.findUserById(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE users SET 
        email = COALESCE(?, email),
        name = COALESCE(?, name),
        password_hash = COALESCE(?, password_hash),
        role = COALESCE(?, role),
        account_id = COALESCE(?, account_id),
        admin_id = COALESCE(?, admin_id),
        branch_id = COALESCE(?, branch_id),
        updated_at = ?
      WHERE id = ?
    `).run(
      email ?? null, 
      name ?? null, 
      passwordHash ?? null, 
      role ?? null, 
      accountId !== undefined ? accountId : null, 
      adminId !== undefined ? adminId : null, 
      branchId !== undefined ? branchId : null, 
      timestamp, 
      id
    );
    return this.findUserById(id);
  },

  listUsers({ accountId, adminId, role, branchId } = {}) {
    const baseQuery = `
      SELECT
        users.*,
        accounts.name AS account_name,
        accounts.slug AS account_slug,
        admins.name AS admin_name,
        admins.email AS admin_email,
        branches.name AS branch_name
      FROM users
      LEFT JOIN accounts ON accounts.id = users.account_id
      LEFT JOIN users admins ON admins.id = users.admin_id
      LEFT JOIN branches ON branches.id = users.branch_id
    `;
    const filters = [];
    const params = [];

    if (accountId) {
      filters.push("users.account_id = ?");
      params.push(accountId);
    }

    if (adminId) {
      filters.push("users.admin_id = ?");
      params.push(adminId);
    }

    if (role) {
      filters.push("users.role = ?");
      params.push(role);
    }

    if (branchId) {
      filters.push("users.branch_id = ?");
      params.push(branchId);
    }

    const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const rows = db.prepare(`${baseQuery}${where} ORDER BY users.created_at DESC`).all(...params);

    return rows.map(mapUser).map(publicUser);
  },

  listAdmins({ accountId } = {}) {
    return this.listUsers({ accountId, role: "BUSINESS_OWNER" }); // Business Owner acts as ADMIN in user terms
  },

  deleteUser(id) {
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
  },

  deleteAccount(id) {
    db.prepare("DELETE FROM users WHERE account_id = ?").run(id);
    const result = db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
    return result.changes > 0;
  },

  createBranch({ id, name, accountId }) {
    const timestamp = now();
    const finalId = id || randomUUID();
    db.prepare("INSERT INTO branches (id, name, account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run(finalId, name, accountId, timestamp, timestamp);
    return { id: finalId, name, accountId };
  },

  listBranches(accountId) {
    if (accountId) {
      return db.prepare("SELECT * FROM branches WHERE account_id = ? ORDER BY name ASC").all(accountId);
    }
    return db.prepare("SELECT * FROM branches ORDER BY name ASC").all();
  },

  findBranchById(id) {
    return db.prepare("SELECT * FROM branches WHERE id = ?").get(id);
  },

  ensureDefaultIntegrations(accountId) {
    if (!accountId) return;
    const timestamp = now();
    const statement = db.prepare(`
      INSERT INTO account_integrations (
        id, account_id, platform_key, platform_name, status, config, connected_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'disconnected', '{}', NULL, ?, ?)
      ON CONFLICT(account_id, platform_key) DO NOTHING
    `);

    for (const platform of INTEGRATION_PLATFORMS) {
      statement.run(randomUUID(), accountId, platform.key, platform.name, timestamp, timestamp);
    }
  },

  listAccountIntegrations(accountId) {
    this.ensureDefaultIntegrations(accountId);
    return db
      .prepare("SELECT * FROM account_integrations WHERE account_id = ? ORDER BY platform_name ASC")
      .all(accountId)
      .map(mapIntegration);
  },

  setAccountIntegration(accountId, platformKey, { status, config = {} }) {
    const platform = INTEGRATION_PLATFORMS.find((item) => item.key === platformKey);
    if (!platform) return null;

    this.ensureDefaultIntegrations(accountId);
    const timestamp = now();
    const connectedAt = status === "connected" ? timestamp : null;
    db.prepare(`
      UPDATE account_integrations SET
        status = ?,
        config = ?,
        connected_at = ?,
        updated_at = ?
      WHERE account_id = ? AND platform_key = ?
    `).run(status, JSON.stringify(config), connectedAt, timestamp, accountId, platformKey);

    return mapIntegration(
      db.prepare("SELECT * FROM account_integrations WHERE account_id = ? AND platform_key = ?").get(accountId, platformKey)
    );
  },

  listDashboardRecords({ accountId, branchId } = {}) {
    const baseQuery = `
      SELECT dashboard_records.*, accounts.name AS account_name, accounts.slug AS account_slug
      FROM dashboard_records
      JOIN accounts ON accounts.id = dashboard_records.account_id
    `;
    
    // In our simplified layout, records are linked to accounts, but we can filter dashboard queries or display based on role scope.
    // If a branchId is specified, we filter by branch (which can map to specific records if we want, or mock it).
    // Let's allow accountId filtering.
    const filters = [];
    const params = [];
    
    if (accountId) {
      filters.push("dashboard_records.account_id = ?");
      params.push(accountId);
    }
    
    const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const rows = db.prepare(`${baseQuery}${where} ORDER BY occurred_at DESC LIMIT 100`).all(...params);

    return rows.map(mapRecord);
  },

  upsertDashboardRecords(accountId, records) {
    const statement = db.prepare(`
      INSERT INTO dashboard_records (
        id, account_id, source_id, title, metric, status, occurred_at, raw, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, source_id) DO UPDATE SET
        title = excluded.title,
        metric = excluded.metric,
        status = excluded.status,
        occurred_at = excluded.occurred_at,
        raw = excluded.raw,
        updated_at = excluded.updated_at
    `);

    try {
      db.exec("BEGIN");
      for (const record of records) {
        const timestamp = now();
        statement.run(
          randomUUID(),
          accountId,
          record.sourceId,
          record.title,
          record.metric,
          record.status,
          new Date(record.occurredAt).toISOString(),
          JSON.stringify(record.raw ?? record),
          timestamp,
          timestamp
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return records.length;
  }
};

if (config.bootstrapDeveloperEmail && config.bootstrapDeveloperPassword && store.countUsers() === 0) {
  store.createUser({
    email: config.bootstrapDeveloperEmail,
    name: "Cortexy Developer",
    passwordHash: bcrypt.hashSync(config.bootstrapDeveloperPassword, 12),
    role: "DEVELOPER"
  });
}
