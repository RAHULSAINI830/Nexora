import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Database, RefreshCcw, Settings, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { apiRequest } from "./api";
import "./styles.css";

const roleLabels = {
  DEVELOPER: "Developer",
  ADMIN: "Admin",
  USER: "User"
};

function Login({ onLogin }) {
  const [email, setEmail] = useState("developer@cortexy.local");
  const [password, setPassword] = useState("developer123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("cortexy_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand-lockup">
          <div className="brand-mark">C</div>
          <div>
            <h1>Cortexy</h1>
            <p>Operational data dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            <Shield size={18} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <article className="metric-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Dashboard({ user, onLogout }) {
  const [records, setRecords] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [managedUsers, setManagedUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: user.role === "DEVELOPER" ? "ADMIN" : "USER",
    accountId: user.accountId ?? "",
    adminId: ""
  });

  const canSync = user.role === "DEVELOPER" || user.role === "ADMIN";
  const canManageAccounts = user.role === "DEVELOPER";
  const canManageUsers = user.role === "DEVELOPER" || user.role === "ADMIN";

  async function loadDashboard(accountId = selectedAccountId) {
    setLoading(true);
    const query = accountId ? `?accountId=${accountId}` : "";
    const data = await apiRequest(`/dashboard/records${query}`);
    setRecords(data.records);
    setLoading(false);
  }

  async function loadUsers(accountId = selectedAccountId) {
    if (!canManageUsers) return;
    setUsersLoading(true);
    const query = user.role === "DEVELOPER" && accountId ? `?accountId=${accountId}` : "";
    const data = await apiRequest(`/auth/users${query}`);
    setManagedUsers(data.users);
    setUsersLoading(false);
  }

  async function loadAdmins(accountId = selectedAccountId) {
    if (user.role !== "DEVELOPER") return;
    const query = accountId ? `?accountId=${accountId}` : "";
    const data = await apiRequest(`/auth/admins${query}`);
    setAdmins(data.admins);
    setUserForm((current) => ({
      ...current,
      adminId: data.admins.some((admin) => admin.id === current.adminId) ? current.adminId : data.admins[0]?.id ?? ""
    }));
  }

  async function loadAccounts() {
    if (!canManageAccounts) return;
    const data = await apiRequest("/accounts");
    setAccounts(data.accounts);
    if (!selectedAccountId && data.accounts[0]) {
      setSelectedAccountId(data.accounts[0].id);
      setUserForm((current) => ({ ...current, accountId: current.accountId || data.accounts[0].id }));
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      await loadAccounts();
      await loadDashboard();
      if (canManageUsers) {
        await loadUsers();
        await loadAdmins();
      }
    }

    loadInitialData();
  }, []);

  async function handleSync() {
    setNotice("");
    const body = user.role === "DEVELOPER" ? { accountId: selectedAccountId } : {};

    try {
      const data = await apiRequest("/dashboard/sync", {
        method: "POST",
        body: JSON.stringify(body)
      });
      setNotice(`Synced ${data.synced} records into our database.`);
      await loadDashboard(selectedAccountId);
      await loadAccounts();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setNotice("");

    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: user.role === "ADMIN" ? "USER" : userForm.role,
        accountId: user.role === "DEVELOPER" ? userForm.accountId : undefined,
        adminId: user.role === "DEVELOPER" && userForm.role === "USER" ? userForm.adminId : undefined
      };

      await apiRequest("/auth/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setNotice(`${roleLabels[payload.role]} created successfully.`);
      setUserForm((current) => ({
        ...current,
        name: "",
        email: "",
        password: "",
        adminId: payload.role === "ADMIN" ? "" : current.adminId
      }));
      await loadUsers(selectedAccountId);
      await loadAdmins(selectedAccountId);
      await loadAccounts();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleDeleteUser(targetUser) {
    setNotice("");

    try {
      await apiRequest(`/auth/users/${targetUser.id}`, { method: "DELETE" });
      setNotice(`${targetUser.name} was deleted.`);
      await loadUsers(selectedAccountId);
      await loadAccounts();
    } catch (err) {
      setNotice(err.message);
    }
  }

  const totals = useMemo(() => {
    const healthy = records.filter((record) => record.status === "healthy").length;
    const accountsVisible = canManageAccounts ? accounts.length : user.account ? 1 : 0;

    return {
      records: records.length,
      healthy,
      accounts: accountsVisible,
      users: managedUsers.length
    };
  }, [records, accounts, canManageAccounts, user.account, managedUsers]);

  const pageTitle = {
    dashboard: user.role === "DEVELOPER" ? "All accounts" : user.account?.name ?? "Assigned account",
    data: "Stored API data",
    settings: "Settings"
  }[activeView];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup compact">
          <div className="brand-mark">C</div>
          <strong>Cortexy</strong>
        </div>
        <nav>
          <button className={activeView === "dashboard" ? "active" : ""} onClick={() => setActiveView("dashboard")}>
            <BarChart3 size={18} /> Dashboard
          </button>
          <button className={activeView === "data" ? "active" : ""} onClick={() => setActiveView("data")}>
            <Database size={18} /> Data Store
          </button>
          <button className={activeView === "settings" ? "active" : ""} onClick={() => setActiveView("settings")}>
            <Settings size={18} /> Settings
          </button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>{roleLabels[user.role]} access</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-actions">
            {canManageAccounts ? (
              <select value={selectedAccountId} onChange={(event) => {
                const accountId = event.target.value;
                setSelectedAccountId(accountId);
                setUserForm((current) => ({ ...current, accountId, adminId: "" }));
                loadDashboard(accountId);
                loadUsers(accountId);
                loadAdmins(accountId);
              }}>
                <option value="">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            ) : null}
            {canSync && activeView !== "settings" ? (
              <button onClick={handleSync} className="secondary-button">
                <RefreshCcw size={16} />
                Sync API
              </button>
            ) : null}
            <button onClick={onLogout} className="ghost-button">Logout</button>
          </div>
        </header>

        {activeView === "dashboard" ? (
          <section className="metrics-grid">
            <MetricCard label="Stored records" value={totals.records} icon={Database} />
            <MetricCard label="Healthy metrics" value={totals.healthy} icon={BarChart3} />
            <MetricCard label={canManageUsers ? "Managed users" : "Visible accounts"} value={canManageUsers ? totals.users : totals.accounts} icon={Users} />
          </section>
        ) : null}

        {notice ? <p className="notice">{notice}</p> : null}

        {activeView === "settings" ? (
          <section className="data-section">
          <div className="section-header">
            <h2>{canManageUsers ? "User management" : "Account settings"}</h2>
            <span>{canManageUsers ? (usersLoading ? "Loading..." : `${managedUsers.length} people`) : roleLabels[user.role]}</span>
          </div>
          {canManageUsers ? (
            <div className="management-grid">
            <form className="user-form" onSubmit={handleCreateUser}>
              <label>
                Name
                <input
                  value={userForm.name}
                  onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Full name"
                  required
                />
              </label>
              <label>
                Email
                <input
                  value={userForm.email}
                  onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@company.com"
                  type="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={userForm.password}
                  onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                  minLength="8"
                  placeholder="Minimum 8 characters"
                  type="password"
                  required
                />
              </label>
              {user.role === "DEVELOPER" ? (
                <>
                  <label>
                    Role
                    <select
                      value={userForm.role}
                      onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value, adminId: "" }))}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="USER">User</option>
                    </select>
                  </label>
                  <label>
                    Account
                    <select
                      value={userForm.accountId}
                      onChange={(event) => setUserForm((current) => ({ ...current, accountId: event.target.value }))}
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                      ))}
                    </select>
                  </label>
                  {userForm.role === "USER" ? (
                    <label>
                      Admin
                      <select
                        value={userForm.adminId}
                        onChange={(event) => setUserForm((current) => ({ ...current, adminId: event.target.value }))}
                        required
                      >
                        <option value="">Select admin</option>
                        {admins
                          .filter((admin) => !userForm.accountId || admin.accountId === userForm.accountId)
                          .map((admin) => (
                            <option key={admin.id} value={admin.id}>{admin.name}</option>
                          ))}
                      </select>
                    </label>
                  ) : null}
                </>
              ) : null}
              <button type="submit" className="secondary-button">
                <UserPlus size={16} />
                Create {user.role === "ADMIN" ? "User" : roleLabels[userForm.role]}
              </button>
            </form>

            <div className="table-wrap users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Account</th>
                    <th>Admin</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managedUsers.map((managedUser) => (
                    <tr key={managedUser.id}>
                      <td>{managedUser.name}</td>
                      <td>{managedUser.email}</td>
                      <td><span className={`status role-${managedUser.role.toLowerCase()}`}>{roleLabels[managedUser.role]}</span></td>
                      <td>{managedUser.account?.name ?? "Global"}</td>
                      <td>{managedUser.admin?.name ?? (managedUser.role === "ADMIN" ? "Self managed" : "Unassigned")}</td>
                      <td>
                        {managedUser.role !== "DEVELOPER" && managedUser.id !== user.id ? (
                          <button className="icon-button danger" onClick={() => handleDeleteUser(managedUser)} title={`Delete ${managedUser.name}`}>
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="muted-text">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!managedUsers.length && !usersLoading ? (
                    <tr>
                      <td colSpan="6" className="empty-state">No users found for this view.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          ) : (
            <div className="settings-summary">
              <div>
                <span>Name</span>
                <strong>{user.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{roleLabels[user.role]}</strong>
              </div>
              <div>
                <span>Account</span>
                <strong>{user.account?.name ?? "Assigned account"}</strong>
              </div>
            </div>
          )}
        </section>
        ) : null}

        {activeView === "dashboard" || activeView === "data" ? (
          <section className="data-section">
          <div className="section-header">
            <h2>Dashboard data</h2>
            <span>{loading ? "Loading..." : `${records.length} rows`}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Account</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.title}</td>
                    <td>{record.metric.toLocaleString()}</td>
                    <td><span className={`status ${record.status}`}>{record.status}</span></td>
                    <td>{record.account?.name ?? "Account"}</td>
                    <td>{new Date(record.occurredAt).toLocaleString()}</td>
                  </tr>
                ))}
                {!records.length && !loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No stored records yet. Sync the API to create the first dashboard rows.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiRequest("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("cortexy_token"))
      .finally(() => setChecking(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem("cortexy_token");
    setUser(null);
  }

  if (checking) {
    return <main className="loading-screen">Loading Cortexy...</main>;
  }

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : <Login onLogin={setUser} />;
}
