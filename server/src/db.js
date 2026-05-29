import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";

const databasePath = resolve(config.databaseFile);
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('DEVELOPER', 'ADMIN', 'USER')),
    account_id TEXT,
    admin_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
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
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE INDEX IF NOT EXISTS dashboard_records_account_time_idx
    ON dashboard_records(account_id, occurred_at);
`);

const userColumns = db.prepare("PRAGMA table_info(users)").all().map((column) => column.name);
if (!userColumns.includes("admin_id")) {
  db.exec("ALTER TABLE users ADD COLUMN admin_id TEXT REFERENCES users(id)");
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

export const store = {
  upsertAccount({ name, slug }) {
    const existing = db.prepare("SELECT * FROM accounts WHERE slug = ?").get(slug);
    if (existing) return mapAccount(existing);

    const timestamp = now();
    const account = { id: randomUUID(), name, slug, created_at: timestamp, updated_at: timestamp };
    db.prepare("INSERT INTO accounts (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run(account.id, account.name, account.slug, account.created_at, account.updated_at);
    return mapAccount(account);
  },

  createAccount({ name, slug }) {
    const timestamp = now();
    const account = { id: randomUUID(), name, slug, created_at: timestamp, updated_at: timestamp };
    db.prepare("INSERT INTO accounts (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run(account.id, account.name, account.slug, account.created_at, account.updated_at);
    return mapAccount(account);
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

  findUserByEmail(email) {
    return mapUser(
      db
        .prepare(`
          SELECT
            users.*,
            accounts.name AS account_name,
            accounts.slug AS account_slug,
            admins.name AS admin_name,
            admins.email AS admin_email
          FROM users
          LEFT JOIN accounts ON accounts.id = users.account_id
          LEFT JOIN users admins ON admins.id = users.admin_id
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
            admins.email AS admin_email
          FROM users
          LEFT JOIN accounts ON accounts.id = users.account_id
          LEFT JOIN users admins ON admins.id = users.admin_id
          WHERE users.id = ?
        `)
        .get(id)
    );
  },

  upsertUser({ email, name, passwordHash, role, accountId = null, adminId = null }) {
    const existing = this.findUserByEmail(email);
    if (existing) return existing;
    return this.createUser({ email, name, passwordHash, role, accountId, adminId });
  },

  createUser({ email, name, passwordHash, role, accountId = null, adminId = null }) {
    const timestamp = now();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role, account_id, admin_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, name, passwordHash, role, accountId, adminId, timestamp, timestamp);
    return this.findUserById(id);
  },

  listUsers({ accountId, adminId, role } = {}) {
    const baseQuery = `
      SELECT
        users.*,
        accounts.name AS account_name,
        accounts.slug AS account_slug,
        admins.name AS admin_name,
        admins.email AS admin_email
      FROM users
      LEFT JOIN accounts ON accounts.id = users.account_id
      LEFT JOIN users admins ON admins.id = users.admin_id
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

    const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const rows = db.prepare(`${baseQuery}${where} ORDER BY users.created_at DESC`).all(...params);

    return rows.map(mapUser).map(publicUser);
  },

  listAdmins({ accountId } = {}) {
    return this.listUsers({ accountId, role: "ADMIN" });
  },

  deleteUser(id) {
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
  },

  listDashboardRecords({ accountId } = {}) {
    const baseQuery = `
      SELECT dashboard_records.*, accounts.name AS account_name, accounts.slug AS account_slug
      FROM dashboard_records
      JOIN accounts ON accounts.id = dashboard_records.account_id
    `;
    const rows = accountId
      ? db.prepare(`${baseQuery} WHERE dashboard_records.account_id = ? ORDER BY occurred_at DESC LIMIT 100`).all(accountId)
      : db.prepare(`${baseQuery} ORDER BY occurred_at DESC LIMIT 100`).all();

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
