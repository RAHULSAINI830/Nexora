import React, { useEffect, useMemo, useState } from "react";
import { 
  AlertCircle, BarChart3, CheckCircle, Database, Link, Pencil, RefreshCcw, 
  Settings, Shield, Trash2, User, UserPlus, Users, X, Activity, Briefcase, 
  DollarSign, Cpu, Sliders, Globe, MapPin, Send, Zap, FileText, Download, 
  Award, TrendingUp, Building, Clock, LogOut, Eye, EyeOff, Search, ChevronLeft,
  MessageSquare, Bot, ExternalLink
} from "lucide-react";
import { apiRequest } from "./api";
import "./styles.css";

const roleLabels = {
  DEVELOPER: "Developer",
  SUPER_ADMIN: "Super Admin",
  BUSINESS_OWNER: "Business Owner",
  MARKETING_MANAGER: "Marketing Manager",
  OPERATIONS_MANAGER: "Operations Manager",
  BRANCH_MANAGER: "Branch Manager",
  TECHNICIAN: "Technician",
  ANALYST: "Read-Only Analyst"
};

const ROLE_LEVELS = {
  DEVELOPER: 8,
  SUPER_ADMIN: 7,
  BUSINESS_OWNER: 6,
  MARKETING_MANAGER: 5,
  OPERATIONS_MANAGER: 5,
  BRANCH_MANAGER: 4,
  ANALYST: 3,
  TECHNICIAN: 2
};

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationNotice, setVerificationNotice] = useState("");
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
      if (err.code === "EMAIL_VERIFICATION_REQUIRED") {
        setVerificationEmail(err.email || email);
        setVerificationNotice("Enter the six-digit code sent to your email.");
        setError("");
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: verificationEmail, code: verificationCode })
      });
      localStorage.setItem("cortexy_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: verificationEmail })
      });
      setVerificationNotice(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-split">
        <div className="login-left">
          <div className="login-header-logo">
            <img src="/logo.png" alt="Nexora AI." className="nexora-logo-login" style={{maxHeight: '40px'}} />
          </div>
          
          <div className="login-form-container">
            <h1>Log in to your account</h1>
            <p className="login-subtitle">Empower Your Business with AI Visibility</p>

            {verificationEmail ? (
              <form onSubmit={handleVerify} className="login-form">
                <label>
                  Verification code
                  <input
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="verification-code-input"
                  />
                </label>
                {verificationNotice ? <p className="form-notice">{verificationNotice}</p> : null}
                {error ? <p className="form-error">{error}</p> : null}
                <button type="submit" disabled={loading || verificationCode.length !== 6} className="btn-primary">
                  {loading ? "Verifying..." : "Verify email"}
                </button>
                <div className="verification-actions">
                  <button type="button" onClick={handleResend} disabled={loading}>Resend code</button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationEmail("");
                      setVerificationCode("");
                      setVerificationNotice("");
                      setError("");
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <label>
                Email
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              </label>
              <label>
                Password
                <span className="password-input">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              {error ? <p className="form-error">{error}</p> : null}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            )}

            {!verificationEmail ? <div className="login-divider">
              <span>Or continue with</span>
            </div> : null}

            {!verificationEmail ? <div className="social-logins">
              <button type="button" className="btn-social">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" height="18" />
                Continue with Google
              </button>
            </div> : null}

            <p className="login-footer-text" style={{ marginTop: '16px' }}>
              Don't have an account? <a href="#">Request access</a>
            </p>
            <p className="login-terms" style={{ marginTop: '8px' }}>
              By continuing you are agreeing to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
        <div className="login-right">
          <div className="login-image-wrapper">
            <img src="/login_abstract_bg.png" alt="Abstract Background" />
          </div>
        </div>
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

function RoleDashboard({ user, records, accounts, branches, onSync, selectedAccountId, setSelectedAccountId, loadDashboard, loadUsers, loadAdmins, loadBranches, managedUsers }) {
  const [syncStatus, setSyncStatus] = useState("Connected");
  const [aiTone, setAiTone] = useState("Professional");
  const [aiTemp, setAiTemp] = useState(0.4);
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState([
    { title: "Summer Discount Specials", clicks: 124, reach: 890 },
    { title: "Grand Opening NYC", clicks: 232, reach: 1450 }
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Technician interactive job list state
  const [techJobs, setTechJobs] = useState([
    { id: 1, task: "Emergency AC Repair (104 Duane St)", status: "In Progress" },
    { id: 2, task: "Smart Thermostat Setup (305 Broadway)", status: "Pending" },
    { id: 3, task: "Routine Duct Inspection (12 Harrison St)", status: "Completed" }
  ]);

  function handleToggleJob(id) {
    setTechJobs(jobs => jobs.map(j => {
      if (j.id === id) {
        const nextStatus = j.status === "Pending" ? "In Progress" : j.status === "In Progress" ? "Completed" : "Pending";
        return { ...j, status: nextStatus };
      }
      return j;
    }));
  }

  function handleCreatePost(e) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosts([{ title: newPost, clicks: 0, reach: 1 }, ...posts]);
    setNewPost("");
  }

  function runExport() {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
    }, 2000);
  }

  const roleName = user.role;

  if (roleName === "DEVELOPER") {
    return (
      <div className="role-dashboard super-admin-panel tab-transition">
        <div className="workspace-context-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
          <div>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '15px', fontWeight: '700' }}>Workspace Context Control</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Switch the active workspace context to manage its users, branches, details, and integrations.</p>
          </div>
          <select 
            value={selectedAccountId} 
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedAccountId(newId);
              loadDashboard(newId);
              loadUsers(newId);
              loadAdmins(newId);
              loadBranches(newId);
            }}
            style={{ 
              width: '280px', 
              height: '42px', 
              background: '#090d16', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              padding: '0 12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        <h3 className="dashboard-section-title">Platform Infrastructure & Global Billing</h3>
        <div className="role-grid">
          <div className="role-card">
            <div className="role-card-header">
              <Cpu className="icon-teal" size={18} />
              <h4>Global AI Engine</h4>
            </div>
            <div className="stat-group">
              <div className="stat-row"><span>Active Model</span> <strong>Claude 3.5 Sonnet</strong></div>
              <div className="stat-row"><span>Daily API Queries</span> <strong>28,450</strong></div>
              <div className="stat-row"><span>Avg Response Time</span> <strong>142ms</strong></div>
            </div>
          </div>
          
          <div className="role-card">
            <div className="role-card-header">
              <Activity className="icon-blue" size={18} />
              <h4>Infrastructure Health</h4>
            </div>
            <div className="stat-group">
              <div className="stat-row"><span>Server Load</span> <strong className="text-green">24%</strong></div>
              <div className="stat-row"><span>Database Operations</span> <strong>99.99%</strong></div>
              <div className="stat-row"><span>Active Sync Queues</span> <strong>0 Pending</strong></div>
            </div>
          </div>

          <div className="role-card">
            <div className="role-card-header">
              <DollarSign className="icon-gold" size={18} />
              <h4>Platform Billing</h4>
            </div>
            <div className="stat-group">
              <div className="stat-row"><span>Platform MRR</span> <strong>$12,450.00</strong></div>
              <div className="stat-row"><span>LTV average</span> <strong>$1,850.00</strong></div>
              <div className="stat-row"><span>Platform Growth</span> <strong className="text-green">+8.4%</strong></div>
            </div>
          </div>
        </div>

        <div className="tenants-list-card">
          <div className="tenants-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Active Tenant Subscriptions ({accounts.length})</h4>
            <button className="btn-add-tenant secondary-button" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }} onClick={() => setIsCreateCompanyOpen(true)}>
              <Building size={14} /> Add Company
            </button>
          </div>
          <div className="tenants-table-wrapper">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Account Slug</th>
                  <th>Workspace Name</th>
                  <th>Users</th>
                  <th>Billing Tier</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} style={{ cursor: 'pointer', background: acc.id === selectedAccountId ? 'rgba(174, 182, 251, 0.08)' : 'transparent' }} onClick={() => {
                    setSelectedAccountId(acc.id);
                    loadDashboard(acc.id);
                    loadUsers(acc.id);
                    loadAdmins(acc.id);
                    loadBranches(acc.id);
                  }}>
                    <td><code>{acc.slug}</code></td>
                    <td>{acc.name}</td>
                    <td>{acc._count?.users ?? 0} active</td>
                    <td><span className="badge-premium">Enterprise</span></td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                      {acc.id !== user.accountId ? (
                        <button 
                          className="btn-delete-company" 
                          onClick={() => handleDeleteCompany(acc.id, acc.name)}
                          title={`Delete Company ${acc.name}`}
                          style={{ padding: '6px 8px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>Active Context</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Workspace Visual Hierarchy & Structure */}
        {selectedAccountId ? (
          <div className="tenants-list-card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0 }}>Workspace Hierarchy & Structure</h4>
              <span className="badge-premium" style={{ fontSize: '11px' }}>Interactive Map</span>
            </div>
            
            <div className="visual-hierarchy-container" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              {(() => {
                const activeComp = accounts.find(a => a.id === selectedAccountId);
                if (!activeComp) return null;

                // Group users by branch
                const workspaceUsers = managedUsers.filter((u) => u.accountId === selectedAccountId);
                const globalUsers = workspaceUsers.filter(u => !u.branchId);
                const branchUsers = (bId) => workspaceUsers.filter(u => u.branchId === bId);
                
                return (
                  <div className="hierarchy-tree" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    
                    {/* Company Root Card */}
                    <div className="hierarchy-node root-node" style={{
                      background: 'linear-gradient(135deg, rgba(174, 182, 251, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                      border: '1px solid #aeb6fb',
                      borderRadius: '12px',
                      padding: '16px 24px',
                      textAlign: 'center',
                      minWidth: '240px',
                      boxShadow: '0 0 20px rgba(174, 182, 251, 0.05)'
                    }}>
                      <Building className="icon-teal" size={24} style={{ marginBottom: '8px', color: '#aeb6fb' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#f8fafc', fontWeight: '700' }}>{activeComp.name}</h4>
                      <code style={{ fontSize: '11px', color: '#aeb6fb' }}>{activeComp.slug}</code>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Admin: {activeComp.administrator || 'Not Set'}</div>
                    </div>
                    
                    {/* Connecting line down */}
                    <div style={{ width: '2px', height: '20px', background: 'rgba(174, 182, 251, 0.2)' }}></div>
                    
                    {/* Level 2: Sub-structures */}
                    <div className="hierarchy-children" style={{ display: 'flex', justifyContent: 'center', gap: '40px', width: '100%', flexWrap: 'wrap' }}>
                      
                      {/* Global / Corporate Members Node */}
                      <div className="hierarchy-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '220px', flex: 1 }}>
                        <div className="hierarchy-node group-node" style={{
                          background: '#f8fafc',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          textAlign: 'center',
                          width: '100%',
                          fontWeight: '600'
                        }}>
                          <Users size={16} style={{ color: '#aeb6fb', marginBottom: '6px' }} />
                          <h5 style={{ margin: 0, fontSize: '13px', color: '#1e293b' }}>Corporate & Admins</h5>
                        </div>
                        <div style={{ width: '2px', height: '12px', background: 'var(--border-color)' }}></div>
                        <div className="hierarchy-members" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          {globalUsers.length ? globalUsers.map(u => (
                            <div key={u.id} className="member-card" style={{
                              background: '#ffffff',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{ color: '#1e293b', fontWeight: '500' }}>{u.name}</span>
                              <span className={`status role-${u.role.toLowerCase()}`} style={{ margin: 0, fontSize: '9px', padding: '2px 6px' }}>
                                {roleLabels[u.role] || u.role}
                              </span>
                            </div>
                          )) : (
                            <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '12px', background: '#ffffff', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>No corporate users</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Branches Nodes */}
                      {branches.map(b => {
                        const bUsers = branchUsers(b.id);
                        return (
                          <div key={b.id} className="hierarchy-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '220px', flex: 1 }}>
                            <div className="hierarchy-node branch-node" style={{
                              background: '#f8fafc',
                              border: '1px solid rgba(174, 182, 251, 0.15)',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              textAlign: 'center',
                              width: '100%',
                              fontWeight: '600'
                            }}>
                              <Globe size={16} style={{ color: '#aeb6fb', marginBottom: '6px' }} />
                              <h5 style={{ margin: 0, fontSize: '13px', color: '#1e293b' }}>{b.name}</h5>
                            </div>
                            <div style={{ width: '2px', height: '12px', background: 'var(--border-color)' }}></div>
                            <div className="hierarchy-members" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                              {bUsers.length ? bUsers.map(u => (
                                <div key={u.id} className="member-card" style={{
                                  background: '#ffffff',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}>
                                  <span style={{ color: '#1e293b', fontWeight: '500' }}>{u.name}</span>
                                  <span className={`status role-${u.role.toLowerCase()}`} style={{ margin: 0, fontSize: '9px', padding: '2px 6px' }}>
                                    {roleLabels[u.role] || u.role}
                                  </span>
                                </div>
                              )) : (
                                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '12px', background: '#ffffff', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>No branch users</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Empty state for branches */}
                      {!branches.length && (
                        <div className="hierarchy-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '220px', flex: 1 }}>
                          <div className="hierarchy-node branch-node" style={{
                            background: '#ffffff',
                            border: '1px dashed var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '12px',
                            width: '100%'
                          }}>
                            No branches created yet
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (roleName === "SUPER_ADMIN" || roleName === "BUSINESS_OWNER") {
    return (
      <div className="role-dashboard business-owner-panel tab-transition">
        <h3 className="dashboard-section-title">Corporate Overview & Integrations</h3>
        <div className="role-grid">
          <div className="role-card">
            <div className="role-card-header">
              <Zap className="icon-teal" size={18} />
              <h4>CRM Sync Status</h4>
            </div>
            <div className="stat-group">
              <div className="stat-row"><span>Connection Status</span> <strong className="text-green">{syncStatus}</strong></div>
              <div className="stat-row"><span>Last Sync Run</span> <strong>4 mins ago</strong></div>
              <div className="stat-row"><span>Synced Contacts</span> <strong>1,420</strong></div>
            </div>
            <button className="btn-small-primary" onClick={async () => {
              setSyncStatus("Syncing...");
              try {
                await onSync();
              } catch {}
              setSyncStatus("Connected");
            }}>Force CRM Sync</button>
          </div>

          <div className="role-card">
            <div className="role-card-header">
              <TrendingUp className="icon-blue" size={18} />
              <h4>Financial Summary</h4>
            </div>
            <div className="stat-group">
              <div className="stat-row"><span>Gross Revenue</span> <strong>$45,200.00</strong></div>
              <div className="stat-row"><span>Active Seats</span> <strong>12 Licences</strong></div>
              <div className="stat-row"><span>Cost per Seat</span> <strong>$15/mo</strong></div>
            </div>
          </div>

          <div className="role-card">
            <div className="role-card-header">
              <Building className="icon-gold" size={18} />
              <h4>Workspace Branches</h4>
            </div>
            <div className="stat-group">
              {branches.length ? branches.map(b => (
                <div className="stat-row" key={b.id}>
                  <span>{b.name}</span>
                  <strong>Active</strong>
                </div>
              )) : (
                <p className="muted-text text-center">No branches created yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roleName === "MARKETING_MANAGER") {
    return (
      <div className="role-dashboard marketing-manager-panel tab-transition">
        <div className="marketing-flex-grid">
          {/* AI Reply Tone Configuration */}
          <div className="marketing-card-col">
            <div className="role-card flex-grow">
              <div className="role-card-header">
                <Sliders className="icon-teal" size={18} />
                <h4>Configure Auto-Reply Tone</h4>
              </div>
              <div className="tone-form">
                <div className="input-group">
                  <label>Selected Sentiment Profile</label>
                  <select value={aiTone} onChange={e => setAiTone(e.target.value)}>
                    <option value="Professional">Professional (Polite, Informative)</option>
                    <option value="Casual">Casual (Friendly, Conversational)</option>
                    <option value="Witty">Witty (Energetic, Smart)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>AI Temperature (Creativity: {aiTemp})</label>
                  <input type="range" min="0.1" max="1.0" step="0.1" value={aiTemp} onChange={e => setAiTemp(parseFloat(e.target.value))} />
                </div>
                <div className="preview-bubble">
                  <h5>Generated Auto-Reply Preview</h5>
                  <p>
                    {aiTone === "Professional" && "Thank you for sharing your feedback. We appreciate your partnership and look forward to delivering exceptional service in the future."}
                    {aiTone === "Casual" && "Thanks a lot for the review! We're super happy you had a great experience and we can't wait to help you out again next time!"}
                    {aiTone === "Witty" && "Wow, we're blushing! Thanks for the awesome rating. Our team works hard, but reviews like yours make it feel like play!"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* GBP Posts and Local Reviews Heatmap */}
          <div className="marketing-card-col">
            <div className="role-card">
              <div className="role-card-header">
                <Globe className="icon-blue" size={18} />
                <h4>Google Business Profile Posts</h4>
              </div>
              <form onSubmit={handleCreatePost} className="inline-form">
                <input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Type a new update post..." />
                <button type="submit" className="btn-small-submit">Post</button>
              </form>
              <div className="posts-list">
                {posts.map((post, idx) => (
                  <div className="post-item" key={idx}>
                    <div className="post-details">
                      <strong>{post.title}</strong>
                      <span>{post.reach} reach • {post.clicks} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="role-card">
              <div className="role-card-header">
                <MapPin className="icon-gold" size={18} />
                <h4>City-wide Sentiment Heatmap</h4>
              </div>
              <p className="section-subtitle">Local Review Density & Sentiment by Sector</p>
              <div className="heatmap-container">
                <div className="heatmap-sector sector-high">Manhattan Central (High Sentiment)</div>
                <div className="heatmap-sector sector-med">Brooklyn North (Medium Sentiment)</div>
                <div className="heatmap-sector sector-high">Miami Beach Branch (High Sentiment)</div>
                <div className="heatmap-sector sector-low">Queens Outer (Needs Attention)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roleName === "OPERATIONS_MANAGER") {
    return (
      <div className="role-dashboard operations-panel tab-transition">
        <h3 className="dashboard-section-title">Technician Performance & Routing Ratios</h3>
        <div className="role-grid">
          <div className="role-card double-width-card">
            <div className="role-card-header">
              <Award className="icon-teal" size={18} />
              <h4>Technician Operational Metrics</h4>
            </div>
            <div className="technicians-table-wrapper">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>Average Rating</th>
                    <th>On-Time Rate</th>
                    <th>Job Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Jimmy Diaz</strong></td>
                    <td>⭐⭐⭐⭐⭐ 4.85 / 5.0</td>
                    <td><span className="text-green">97.2%</span></td>
                    <td>42 mins average</td>
                  </tr>
                  <tr>
                    <td><strong>Sarah Connor</strong></td>
                    <td>⭐⭐⭐⭐⭐ 4.90 / 5.0</td>
                    <td><span className="text-green">99.1%</span></td>
                    <td>38 mins average</td>
                  </tr>
                  <tr>
                    <td><strong>John Doe</strong></td>
                    <td>⭐⭐⭐⭐ 4.20 / 5.0</td>
                    <td><span className="text-gold">88.5%</span></td>
                    <td>55 mins average</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="role-card">
            <div className="role-card-header">
              <Clock className="icon-blue" size={18} />
              <h4>Operational Efficiency</h4>
            </div>
            <div className="stat-group">
              <div className="stat-row"><span>Route Optimization</span> <strong>85.0%</strong></div>
              <div className="stat-row"><span>Idle Time Delay</span> <strong>4.5 hrs total</strong></div>
              <div className="stat-row"><span>Resource Allocation</span> <strong className="text-green">Optimal</strong></div>
            </div>
            <div className="meter-wrapper">
              <label>Efficiency index</label>
              <div className="meter-bar"><div className="meter-fill" style={{width: '82.5%'}}></div></div>
              <span>82.5% Optimal Rate</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roleName === "BRANCH_MANAGER") {
    return (
      <div className="role-dashboard branch-manager-panel tab-transition">
        <h3 className="dashboard-section-title">Branch Jobs & Local Workflows</h3>
        <div className="kanban-wrapper">
          <div className="kanban-column">
            <h5>Pending Tasks</h5>
            <div className="kanban-list">
              <div className="kanban-item card-yellow">
                <strong>AC Thermostat Setup</strong>
                <p className="muted-text">Scheduled: 3:00 PM today</p>
                <span className="badge">North Branch</span>
              </div>
            </div>
          </div>
          <div className="kanban-column">
            <h5>In Progress</h5>
            <div className="kanban-list">
              <div className="kanban-item card-blue">
                <strong>Emergency Compressor Swap</strong>
                <p className="muted-text">Jimmy Diaz is on site</p>
                <span className="badge">North Branch</span>
              </div>
            </div>
          </div>
          <div className="kanban-column">
            <h5>Completed (Today)</h5>
            <div className="kanban-list">
              <div className="kanban-item card-green">
                <strong>Regular Duct Cleaning</strong>
                <p className="muted-text">Completed 10:30 AM</p>
                <span className="badge">North Branch</span>
              </div>
            </div>
          </div>
        </div>

        <div className="reviews-card-full">
          <h4>Recent Location Reviews</h4>
          <div className="review-feed">
            <div className="review-bubble-item">
              <div className="review-header-info"><strong>Marcia K.</strong> <span>⭐⭐⭐⭐⭐</span></div>
              <p>"Jimmy from North Branch came out on short notice and got our cooling back online. Outstanding!"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roleName === "TECHNICIAN") {
    return (
      <div className="role-dashboard technician-panel tab-transition">
        <div className="marketing-flex-grid">
          <div className="marketing-card-col">
            <div className="role-card flex-grow">
              <div className="role-card-header">
                <Briefcase className="icon-teal" size={18} />
                <h4>My Scheduled Jobs Today</h4>
              </div>
              <p className="section-subtitle">Click items to progress status</p>
              <div className="tech-checklist">
                {techJobs.map(job => (
                  <div key={job.id} className={`checklist-item ${job.status.toLowerCase().replace(" ", "-")}`} onClick={() => handleToggleJob(job.id)}>
                    <div className="check-box">
                      {job.status === "Completed" ? <CheckCircle size={16} /> : job.status === "In Progress" ? <Activity size={16} /> : null}
                    </div>
                    <div className="check-details">
                      <strong>{job.task}</strong>
                      <span className={`badge-status status-${job.status.toLowerCase().replace(" ", "-")}`}>{job.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="marketing-card-col">
            <div className="role-card">
              <div className="role-card-header">
                <Award className="icon-blue" size={18} />
                <h4>My Performance Rating</h4>
              </div>
              <div className="technician-score-center">
                <h2>4.85</h2>
                <span>Out of 5.0 Stars (140 ratings)</span>
              </div>
              <div className="stat-group margin-top">
                <div className="stat-row"><span>Jobs Completed (Week)</span> <strong>14</strong></div>
                <div className="stat-row"><span>On-Time Rate</span> <strong>97.2%</strong></div>
              </div>
            </div>

            <div className="role-card">
              <div className="role-card-header">
                <FileText className="icon-gold" size={18} />
                <h4>Reviews Mentioning Me</h4>
              </div>
              <div className="review-bubble-item">
                <div className="review-header-info"><strong>Marcia K.</strong> <span>⭐⭐⭐⭐⭐</span></div>
                <p>"Jimmy from North Branch came out on short notice and got our cooling back online. Outstanding!"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roleName === "ANALYST") {
    return (
      <div className="role-dashboard analyst-panel tab-transition">
        <h3 className="dashboard-section-title">Audit Reports & Database Exporter</h3>
        <div className="role-grid">
          <div className="role-card double-width-card">
            <div className="role-card-header">
              <Download className="icon-teal" size={18} />
              <h4>Export Corporate Audit Package</h4>
            </div>
            <p>Generate a complete CSV/Excel backup of all tenant accounts, branches, user listings, and synced dashboard records for this billing cycle.</p>
            <div className="button-group-export">
              <button className="btn-primary" onClick={runExport} disabled={isExporting}>
                <Download size={16} />
                {isExporting ? "Compiling Export..." : "Download CSV Data Store"}
              </button>
            </div>
            {isExporting && <div className="spinner-progress">Processing datasets...</div>}
            {exportSuccess && <p className="text-green font-semibold mt-2">Success! Audit package downloaded successfully.</p>}
          </div>

          <div className="role-card">
            <div className="role-card-header">
              <Shield className="icon-blue" size={18} />
              <h4>Data Compliance Logs</h4>
            </div>
            <div className="stat-group">
              <div className="stat-row"><span>GDPR Status</span> <strong className="text-green">Compliant</strong></div>
              <div className="stat-row"><span>HIPAA Compliance</span> <strong className="text-green">Compliant</strong></div>
              <div className="stat-row"><span>Encryption Level</span> <strong>AES-256 Bit</strong></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const otterlyDashboardTabs = [
  ["overview", "Overview", BarChart3],
  ["prompts", "Prompts", MessageSquare],
  ["research", "Prompt research", Search],
  ["citations", "Citations", Link],
  ["recommendations", "Recommendations", Zap],
  ["brands", "Brands", Building],
  ["audits", "GEO audits", Shield],
  ["account", "Account & sync", RefreshCcw]
];

function OtterlyDashboardPanel({ data, loading, canSync, onSync, onReload, accounts, selectedAccountId, setSelectedAccountId, user, activeTab }) {
  const [promptSearch, setPromptSearch] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [promptDrawerTab, setPromptDrawerTab] = useState("responses");
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(null);
  const [citationPage, setCitationPage] = useState(1);
  const [citationPageSize, setCitationPageSize] = useState(25);
  const [syncingOtterly, setSyncingOtterly] = useState(false);
  const [crawlabilityUrl, setCrawlabilityUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentCrawler, setContentCrawler] = useState("ChatGPT-User");
  const [auditSubmitting, setAuditSubmitting] = useState("");
  const [auditNotice, setAuditNotice] = useState("");
  const [expandedCrawlId, setExpandedCrawlId] = useState(null);
  const [expandedContentId, setExpandedContentId] = useState(null);
  const dashboard = data?.dashboard;
  const kpis = dashboard?.kpis || {};
  const resources = data?.resources || [];
  const insights = dashboard?.cortexyInsights || [];
  const citations = dashboard?.citations || [];
  const prompts = dashboard?.prompts || [];
  const promptDetails = resources.find((resource) => resource.resourceType === "prompt-details")?.payload?.items || [];
  const citationPrompts = resources.find((resource) => resource.resourceType === "citation-prompts")?.payload?.items || [];
  const recommendations = dashboard?.recommendations || [];
  const aiResponses = dashboard?.aiResponses || [];
  const detectedBrands = dashboard?.detectedBrands || [];
  const brandAnalysis = dashboard?.brandAnalysis || {};
  const citationStats = dashboard?.citationStats || {};
  const crawlability = dashboard?.audits?.crawlability || [];
  const content = dashboard?.audits?.content || [];
  const finishedCrawlAudits = crawlability.filter((check) => ["completed", "crawled", "failed"].includes(check.status));
  const successfulCrawlAudits = finishedCrawlAudits.filter((check) => ["completed", "crawled"].includes(check.status));
  const crawlSuccessRate = finishedCrawlAudits.length
    ? Math.round((successfulCrawlAudits.length / finishedCrawlAudits.length) * 100)
    : null;
  const contentReadabilityScores = content
    .map((check) => Number(check.structuralAnalysis?.overallScore))
    .filter(Number.isFinite);
  const averageReadability = contentReadabilityScores.length
    ? Math.round(contentReadabilityScores.reduce((sum, score) => sum + score, 0) / contentReadabilityScores.length)
    : null;
  const accountInfo = dashboard?.accountInfo || {};
  const connected = data?.integration?.status === "connected";

  if (loading) {
    return <section className="data-section tab-transition"><p className="muted-text">Loading Otterly data...</p></section>;
  }

  if (!connected || !resources.length) {
    return (
      <section className="data-section tab-transition">
        <div className="section-header">
          <h2>AI visibility data</h2>
        </div>
        {user.role === "DEVELOPER" && accounts.length ? (
          <div className="users-filter-bar" style={{ marginBottom: "16px" }}>
            <span className="muted-text">Selected client</span>
            <select className="premium-filter-select" value={selectedAccountId || ""} onChange={(event) => setSelectedAccountId(event.target.value)}>
              <option value="">Select Company</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </div>
        ) : null}
        <div className="empty-state-content">
          <Database size={32} className="empty-icon" />
          <p>No Otterly data is stored yet. Connect the Otterly integration for this company, then refresh the integration data.</p>
          {user.role === "DEVELOPER" && canSync ? (
            <button
              type="button"
              className="developer-sync-button"
              onClick={async () => {
                setSyncingOtterly(true);
                try {
                  await onSync();
                } finally {
                  setSyncingOtterly(false);
                }
              }}
              disabled={syncingOtterly || !selectedAccountId}
            >
              <RefreshCcw size={15} />
              {syncingOtterly ? "Refreshing..." : "Refresh integration data"}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const metricCards = [
    ["Brand coverage", `${Number(kpis.brandCoverage || 0).toFixed(1)}%`],
    ["Domain coverage", `${Number(kpis.domainCoverage || 0).toFixed(1)}%`],
    ["Share of voice", `${Number(kpis.shareOfVoice || 0).toFixed(1)}%`],
    ["Avg position", formatCell(kpis.averagePosition)],
    ["Prompts", kpis.totalPrompts ?? 0],
    ["Citations", kpis.totalCitations ?? 0]
  ];
  const tableEmpty = (colSpan, text) => (
    <tr>
      <td colSpan={colSpan} className="empty-state">{text}</td>
    </tr>
  );

  const jsonPreview = (value) => (
    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "260px", overflow: "auto", margin: 0, fontSize: "11px", color: "#334155" }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
  function formatCell(value, fallback = "N/A") {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value !== "object") return value;
    if (Array.isArray(value)) {
      return value.map((item) => formatCell(item, "")).filter(Boolean).join(", ") || fallback;
    }
    if ("neutral" in value || "positive" in value || "negative" in value || "nss" in value) {
      return sentimentLabel(value);
    }
    if ("rank" in value || "brand" in value || "mentions" in value) {
      const parts = [];
      if (value.brand) parts.push(String(value.brand));
      if (value.rank !== undefined && value.rank !== null) parts.push(`rank ${value.rank}`);
      if (value.mentions !== undefined && value.mentions !== null) parts.push(`${value.mentions} mentions`);
      if (value.brandCoverage !== undefined && value.brandCoverage !== null) parts.push(`${Number(value.brandCoverage).toFixed(1)}% coverage`);
      if (value.sentiment) parts.push(`sentiment ${formatCell(value.sentiment, "")}`);
      return parts.join(" / ") || JSON.stringify(value);
    }
    return JSON.stringify(value);
  }
  const promptResponseGroup = (promptId) => aiResponses.find((group) => group.promptId === promptId) || { items: [] };
  const promptTotalCitations = (promptId) => promptResponseGroup(promptId).items.reduce((total, response) => total + (response.citations?.length || 0), 0);
  const normalizeBrandKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const competitorDomains = new Map(
    (dashboard?.competitors || []).flatMap((competitor) => {
      const domain = competitor.brandDomain || competitor.domain || competitor.url || "";
      return [competitor.brand, competitor.name, ...(competitor.brandVariations || [])]
        .filter(Boolean)
        .map((name) => [normalizeBrandKey(name), domain]);
    })
  );
  const resolveCompetitor = (competitor) => {
    const value = typeof competitor === "string" ? { brand: competitor } : competitor || {};
    const brand = value.brand || value.name || value.brandDomain || value.domain || "Competitor";
    const domain = value.brandDomain
      || value.domain
      || value.url
      || competitorDomains.get(normalizeBrandKey(brand))
      || "";
    return { brand, domain };
  };
  const promptCompetitors = (prompt) => (prompt.competitors || [])
    .map(resolveCompetitor)
    .filter((competitor) => competitor.brand);
  const competitorLogoUrl = (competitor) => {
    const rawDomain = competitor.domain || competitor.brandDomain || "";
    const domain = String(rawDomain).replace(/^https?:\/\//, "").split("/")[0];
    return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : "";
  };
  const renderCompetitorIcons = (competitors) => competitors.length ? (
    <div className="competitor-icons">
      {competitors.map((competitor, index) => (
        <span className="competitor-icon-wrap" key={`${competitor.brand}-${competitor.domain || ""}-${index}`}>
          <span className="competitor-icon">
            <Building className="competitor-icon-fallback" size={13} />
            {competitorLogoUrl(competitor) ? (
              <img
                src={competitorLogoUrl(competitor)}
                alt={`${competitor.brand} favicon`}
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            ) : null}
          </span>
          <span className="competitor-tooltip">{competitor.brand}</span>
        </span>
      ))}
    </div>
  ) : "";
  const filteredPrompts = prompts.filter((prompt) => String(prompt.prompt || "").toLowerCase().includes(promptSearch.toLowerCase()));
  const selectedPrompt = selectedPromptId ? prompts.find((prompt) => prompt.id === selectedPromptId) : null;
  const selectedPromptDetail = selectedPrompt
    ? promptDetails.find((item) => item.id === selectedPrompt.id || item.promptId === selectedPrompt.id) || {}
    : {};
  const selectedPromptResponses = selectedPrompt ? promptResponseGroup(selectedPrompt.id).items || [] : [];
  const selectedResponse = selectedResponseIndex !== null ? selectedPromptResponses[selectedResponseIndex] : null;
  const selectedPromptCategories = selectedPromptDetail.domainCategories || [];
  const selectedPromptBrandRank = selectedPromptDetail.brandRank || [];
  const selectedPromptCoverageHistory = selectedPromptDetail.brandCoverageHistory || [];
  const totalPromptCategories = selectedPromptCategories.reduce((total, item) => total + Number(item.value || 0), 0);
  const categoryColors = ["#5c6cf2", "#3fbcd3", "#ff8a4c", "#4f7df3", "#5ac98f", "#8b5cf6", "#f87171", "#94a3b8"];
  const categoryGradient = selectedPromptCategories.reduce((parts, item, index) => {
    const previous = selectedPromptCategories.slice(0, index).reduce((sum, category) => sum + Number(category.value || 0), 0);
    const start = totalPromptCategories ? (previous / totalPromptCategories) * 100 : 0;
    const end = totalPromptCategories ? ((previous + Number(item.value || 0)) / totalPromptCategories) * 100 : 0;
    parts.push(`${categoryColors[index % categoryColors.length]} ${start}% ${end}%`);
    return parts;
  }, []).join(", ");
  const promptLabel = (prompt, detail = {}) => String(prompt?.prompt || detail?.prompt || "Untitled prompt");
  const engineLabel = (engine) => ({
    perplexity: "Perplexity",
    google: "Google",
    chatgpt: "ChatGPT",
    copilot: "Copilot",
    gemini: "Gemini",
    claude: "Claude"
  }[engine] || "AI");
  const engineLogoUrl = (engine) => ({
    perplexity: "https://cdn.simpleicons.org/perplexity/1f2937",
    google: "https://cdn.simpleicons.org/google",
    copilot: "https://cdn.simpleicons.org/githubcopilot/1f2937",
    chatgpt: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
  }[engine]);
  const engineLogo = (engine) => (
    <span className={`engine-logo engine-${engine || "ai"}`}>
      {engineLogoUrl(engine) ? <img src={engineLogoUrl(engine)} alt="" /> : <Bot size={13} />}
    </span>
  );
  function sentimentLabel(sentiment) {
    if (!sentiment || typeof sentiment !== "object") return formatCell(sentiment);
    const entries = Object.entries(sentiment).filter(([, value]) => Number(value) > 0);
    return entries.length ? entries.map(([key, value]) => `${key} ${value}`).join(", ") : "N/A";
  }
  const sentimentSummary = (sentiment) => {
    if (!sentiment || typeof sentiment !== "object") return null;
    const positive = Number(sentiment.positive || 0);
    const neutral = Number(sentiment.neutral || 0);
    const negative = Number(sentiment.negative || 0);
    const total = positive + neutral + negative;
    if (!total) return null;
    if (negative > positive && negative >= neutral) return { label: "Negative", tone: "negative", score: sentiment.nss };
    if (positive > negative && positive >= neutral) return { label: "Positive", tone: "positive", score: sentiment.nss };
    return { label: "Neutral", tone: "neutral", score: sentiment.nss };
  };
  const renderSentiment = (sentiment, emptyLabel = "Not mentioned") => {
    const summary = sentimentSummary(sentiment);
    if (!summary) return <span className="sentiment-badge muted">{emptyLabel}</span>;
    return (
      <span className={`sentiment-badge ${summary.tone}`}>
        <i /> {summary.label}
        {summary.score !== undefined && summary.score !== null ? <small>NSS {summary.score}</small> : null}
      </span>
    );
  };
  const trackedBrandRank = (detail) => (detail?.brandRank || []).find(
    (item) => normalizeBrandKey(item.brand) === normalizeBrandKey(dashboard?.brand)
  );
  const usagePercent = (used, maximum) => maximum ? Math.min(100, (Number(used || 0) / Number(maximum)) * 100) : 0;
  const brandRankings = brandAnalysis.brandMentions || [];
  const latestVisibility = brandAnalysis.brandVisibilityIndex?.at(-1)?.brands || [];
  const visibilityByBrand = new Map(latestVisibility.map((item) => [normalizeBrandKey(item.brand), item]));
  const citationDomainStats = citationStats.domainCitations || {};
  const rankedCitationDomains = citationStats.domainRank?.citations || [];
  const citationPageCount = Math.max(1, Math.ceil(citations.length / citationPageSize));
  const safeCitationPage = Math.min(citationPage, citationPageCount);
  const paginatedCitations = citations.slice((safeCitationPage - 1) * citationPageSize, safeCitationPage * citationPageSize);
  const existingPromptTexts = new Set(prompts.map((prompt) => String(prompt.prompt || "").toLowerCase().trim()));
  const promptResearchIdeas = citations
    .filter((citation) => citation.title || citation.domainCategory)
    .slice(0, 80)
    .map((citation) => {
      const topic = String(citation.title || citation.domainCategory || "AI search").replace(/\s+/g, " ").trim();
      const shortTopic = topic.replace(/^(how to|how|what is|what are)\s+/i, "").slice(0, 90);
      const promptText = `Which AI solutions help service companies with ${shortTopic}?`;
      return {
        prompt: promptText,
        source: citation.domain || citation.url,
        sourceUrl: citation.url,
        category: citation.domainCategory || "Unclassified",
        citations: citation.citations ?? 0,
        reason: citation.brandMentioned
          ? "Build on a source where the brand already appears."
          : "Close a citation gap around a source AI engines already reference.",
        priority: citation.brandMentioned ? "Expand" : "Gap"
      };
    })
    .filter((idea, index, list) => (
      !existingPromptTexts.has(idea.prompt.toLowerCase()) &&
      list.findIndex((item) => item.prompt === idea.prompt) === index
    ))
    .sort((a, b) => Number(b.citations || 0) - Number(a.citations || 0))
    .slice(0, 18);
  async function runGeoAudit(type) {
    const rawUrl = type === "crawlability" ? crawlabilityUrl : contentUrl;
    if (!rawUrl) return;
    const url = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    setAuditNotice("");
    setAuditSubmitting(type);
    try {
      const result = await apiRequest(`/dashboard/otterly/audits/${type}`, {
        method: "POST",
        body: JSON.stringify({
          accountId: user.role === "DEVELOPER" ? selectedAccountId : undefined,
          url,
          ...(type === "content" ? { crawlerIdentity: contentCrawler, sendOtterlyHeader: true } : {})
        }),
        timeoutMs: 120000
      });
      setAuditNotice(`${type === "crawlability" ? "Crawlability" : "Content"} check started for ${url}. Status: ${result.audit?.status || "pending"}. Results can take a little time to finish in Otterly.`);
      if (type === "crawlability") setCrawlabilityUrl("");
      if (type === "content") setContentUrl("");
      await onReload?.();
    } catch (error) {
      if (error.code === "OTTERLY_REQUEST_LIMIT" || error.status === 429) {
        setAuditNotice("Otterly's team request limit is exhausted. The checker will work again after Otterly resets the quota or the account limit is increased.");
      } else if (error.code === "OTTERLY_AUDIT_FORBIDDEN" || error.status === 403) {
        setAuditNotice("Otterly denied audit creation for this workspace. Enable GEO audit API write access or move the Otterly account to an eligible plan, then try again.");
      } else {
        setAuditNotice(`${error.status ? `Error ${error.status}: ` : ""}${error.message || "Failed to start audit."}`);
      }
    } finally {
      setAuditSubmitting("");
    }
  }
  const exportPromptsCsv = () => {
    const rows = [
      ["Prompt", "Tags", "Intent Volume", "My Brand Mentions", "Brand Sentiment", "My Domain Citations", "Total Citations", "Competitors"],
      ...filteredPrompts.map((prompt) => [
        prompt.prompt || "",
        formatCell(prompt.tags || [], ""),
        prompt.volume ?? prompt.intentVolume ?? "",
        prompt.brandMentions ?? 0,
        formatCell(prompt.brandRank ?? ""),
        prompt.domainMentions ?? 0,
        promptTotalCitations(prompt.id),
        promptCompetitors(prompt).map((competitor) => competitor.brand).join("; ")
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dashboard?.brand || "otterly"}-prompts.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportCitationsCsv = () => {
    const rows = [
      ["Title", "URL", "Domain", "Category", "Citations", "Brand Mentioned", "Competitors"],
      ...citations.map((item) => [
        item.title || "",
        item.url || "",
        item.domain || "",
        item.domainCategory || "Unclassified",
        item.citations ?? 0,
        item.brandMentioned ? "Yes" : "No",
        (item.competitors || []).map((competitor) => competitor.brand || competitor).join("; ")
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dashboard?.brand || "otterly"}-citations.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <section className="data-section tab-transition">
      {user.role === "DEVELOPER" && accounts.length ? (
        <div className="otterly-panel-controls">
          <span className="muted-text">Selected client</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select className="premium-filter-select" value={selectedAccountId || ""} onChange={(event) => setSelectedAccountId(event.target.value)}>
              <option value="">Select Company</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </div>
        </div>
      ) : null}

      {activeTab === "overview" ? (
        <>
          <div className="role-grid">
            {metricCards.map(([label, value]) => (
              <div className="role-card" key={label}>
                <div className="role-card-header">
                  <BarChart3 size={16} className="icon-blue" />
                  <h4>{label}</h4>
                </div>
                <strong style={{ fontSize: "26px", color: "#0f172a" }}>{value}</strong>
              </div>
            ))}
          </div>

          <div className="role-grid" style={{ marginTop: "16px" }}>
            <div className="role-card double-width-card">
              <div className="role-card-header">
                <Zap size={16} className="icon-teal" />
                <h4>Cortexy optimization layer</h4>
              </div>
              <div className="stat-group">
                {insights.length ? insights.map((insight, index) => (
                  <div className="stat-row" key={`${insight.type}-${index}`} style={{ alignItems: "flex-start", gap: "12px" }}>
                    <span style={{ minWidth: "96px", textTransform: "capitalize" }}>{insight.priority}</span>
                    <strong style={{ flex: 1 }}>
                      {insight.title}
                      <small className="muted-text" style={{ display: "block", fontWeight: 500, marginTop: "4px" }}>{insight.detail}</small>
                    </strong>
                  </div>
                )) : <p className="muted-text">No Cortexy optimization insights yet. Sync more Otterly data to generate actions.</p>}
              </div>
            </div>

            <div className="role-card">
              <div className="role-card-header">
                <Cpu size={16} className="icon-gold" />
                <h4>Otterly usage</h4>
              </div>
              <div className="stat-group">
                <div className="stat-row"><span>Plan</span><strong>{accountInfo.subscriptionPlan || "N/A"}</strong></div>
                <div className="stat-row"><span>Prompts</span><strong>{accountInfo.promptsUsedCount ?? 0}/{accountInfo.promptsMaxCount ?? 0}</strong></div>
                <div className="stat-row"><span>API requests</span><strong>{accountInfo.apiRequestsUsedCount ?? 0}/{accountInfo.apiRequestsMaxCount ?? 0}</strong></div>
                <div className="stat-row"><span>GEO audits</span><strong>{accountInfo.geoAuditUsedCount ?? 0}/{accountInfo.geoAuditMaxCount ?? 0}</strong></div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === "prompts" ? (
        <div className="prompt-workspace">
          <div className="prompt-page-header">
            <div>
              <p className="prompt-breadcrumb">Brand Report / {dashboard?.brand || "Brand"} / Prompts</p>
              <h2>Prompts</h2>
              <p className="muted-text">See which AI prompts mention your brand, and which mention your competitors.</p>
            </div>
            <button className="prompt-export-button" onClick={exportPromptsCsv}>
              <Download size={15} /> Export as CSV
            </button>
          </div>

          <div className="prompt-toolbar">
            <div className="prompt-filter-group">
              <button className="prompt-filter-button">Last 14 days</button>
              <button className="prompt-filter-button">All tags</button>
              <button className="prompt-filter-button">All Engines</button>
              <button className="prompt-filter-button">United States</button>
            </div>
            <label className="prompt-search">
              <input
                value={promptSearch}
                onChange={(event) => setPromptSearch(event.target.value)}
                placeholder="Search by prompt text..."
              />
              <Search size={15} />
            </label>
          </div>

          <div className="prompt-table-card">
            <table className="prompt-table">
              <thead>
                <tr>
                  <th>Prompt</th>
                  <th>Tags</th>
                  <th>Intent Volume</th>
                  <th>My Brand Mentions</th>
                  <th>Brand Sentiment</th>
                  <th>My Domain Citations</th>
                  <th>Total Citations</th>
                  <th>Competitors</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrompts.map((prompt) => {
                  const detail = promptDetails.find((item) => item.id === prompt.id || item.promptId === prompt.id) || {};
                  const competitorsForPrompt = promptCompetitors(prompt);
                  return (
                    <tr
                      key={prompt.id || prompt.prompt}
                      className="prompt-table-row"
                      onClick={() => {
                        setSelectedPromptId(prompt.id);
                        setPromptDrawerTab("responses");
                        setSelectedResponseIndex(null);
                      }}
                    >
                      <td className="prompt-title-cell">
                        <button type="button" className="prompt-link">
                          {promptLabel(prompt, detail).slice(0, 76)}{promptLabel(prompt, detail).length > 76 ? "..." : ""}
                        </button>
                      </td>
                      <td>{formatCell(prompt.tags || detail.tags || [], "")}</td>
                      <td>
                        <div className="intent-meter">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span key={index} className={index === 0 ? "active" : ""} />
                          ))}
                        </div>
                      </td>
                      <td>{prompt.brandMentions ?? 0}</td>
                      <td>{renderSentiment(trackedBrandRank(detail)?.sentiment)}</td>
                      <td>{prompt.domainMentions ?? 0}</td>
                      <td>{promptTotalCitations(prompt.id)}</td>
                      <td>{renderCompetitorIcons(competitorsForPrompt)}</td>
                    </tr>
                  );
                })}
                {!filteredPrompts.length ? tableEmpty(8, "No prompts matched your search.") : null}
              </tbody>
            </table>
          </div>
          <p className="prompt-result-count">Viewing {filteredPrompts.length ? `1-${filteredPrompts.length}` : "0"} of {filteredPrompts.length} results</p>
        </div>
      ) : null}

      {activeTab === "research" ? (
        <div className="research-workspace">
          <div className="prompt-page-header">
            <div>
              <p className="prompt-breadcrumb">Cortexy Intelligence / {dashboard?.brand || "Brand"} / Prompt Research</p>
              <h2>AI Prompt Research</h2>
              <p className="muted-text">New prompt opportunities generated from real citations, categories, and competitor gaps already synced from Otterly.</p>
            </div>
            <button className="prompt-export-button" onClick={exportPromptsCsv}>
              <Download size={15} /> Export tracked prompts
            </button>
          </div>

          <div className="research-summary-grid">
            <div className="research-summary-card">
              <Search size={16} />
              <span>Tracked prompts</span>
              <strong>{prompts.length}</strong>
            </div>
            <div className="research-summary-card">
              <Link size={16} />
              <span>Cited sources analyzed</span>
              <strong>{citations.length}</strong>
            </div>
            <div className="research-summary-card">
              <Zap size={16} />
              <span>New opportunities</span>
              <strong>{promptResearchIdeas.length}</strong>
            </div>
          </div>

          <div className="research-list">
            {promptResearchIdeas.map((idea) => (
              <div className="research-card" key={idea.prompt}>
                <div className="research-card-main">
                  <span className="research-priority">{idea.priority}</span>
                  <h3>{idea.prompt}</h3>
                  <p>{idea.reason}</p>
                  <div className="research-meta">
                    <span>{idea.category}</span>
                    <span>{idea.citations} citations</span>
                    {idea.sourceUrl ? <a href={idea.sourceUrl} target="_blank" rel="noreferrer">{idea.source}</a> : <span>{idea.source}</span>}
                  </div>
                </div>
              </div>
            ))}
            {!promptResearchIdeas.length ? (
              <div className="overview-empty-state">
                <Search size={42} />
                <span>No new prompt opportunities found from the current synced data.</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "citations" ? (
        <div className="citation-workspace">
          <div className="prompt-page-header">
            <div>
              <p className="prompt-breadcrumb">Brand Report / {dashboard?.brand || "Brand"} / Citations</p>
              <h2>Citations</h2>
              <p className="muted-text">Review the sources AI engines cite for this brand report.</p>
            </div>
            <button className="prompt-export-button" onClick={exportCitationsCsv}>
              <Download size={15} /> Export as CSV
            </button>
          </div>

          <div className="citation-summary-grid">
            <div className="citation-summary-card">
              <Link size={16} />
              <span>Total citation URLs</span>
              <strong>{citations.length}</strong>
            </div>
            <div className="citation-summary-card">
              <Building size={16} />
              <span>Domains tracked</span>
              <strong>{new Set(citations.map((item) => item.domain).filter(Boolean)).size}</strong>
            </div>
            <div className="citation-summary-card">
              <FileText size={16} />
              <span>Citation prompt maps</span>
              <strong>{citationPrompts.length}</strong>
            </div>
          </div>

          <div className="citation-table-card">
            <table className="prompt-table citation-table">
              <thead>
                <tr>
                  <th>Cited URL</th>
                  <th>Domain</th>
                  <th>Category</th>
                  <th>Citations</th>
                  <th>Brand mentioned</th>
                  <th>Competitors</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCitations.map((item) => {
                  const citationCompetitors = (item.competitors || [])
                    .map(resolveCompetitor)
                    .filter((competitor) => competitor.brand);
                  return (
                    <tr key={item.url}>
                      <td className="citation-title-cell">
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <strong>{item.title || item.url}</strong>
                          <span>{item.url}</span>
                        </a>
                      </td>
                      <td>{item.domain || "N/A"}</td>
                      <td>{item.domainCategory || "Unclassified"}</td>
                      <td>{item.citations ?? 0}</td>
                      <td>{item.brandMentioned ? "Yes" : "No"}</td>
                      <td>{renderCompetitorIcons(citationCompetitors) || "None"}</td>
                    </tr>
                  );
                })}
                {!citations.length ? tableEmpty(6, "No citations synced yet.") : null}
              </tbody>
            </table>
          </div>

          <div className="citation-pagination">
            <span>
              Showing {citations.length ? ((safeCitationPage - 1) * citationPageSize) + 1 : 0}
              -{Math.min(safeCitationPage * citationPageSize, citations.length)} of {citations.length}
            </span>
            <label>
              Rows per page
              <select
                value={citationPageSize}
                onChange={(event) => {
                  setCitationPageSize(Number(event.target.value));
                  setCitationPage(1);
                }}
              >
                {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <div className="citation-page-buttons">
              <button type="button" onClick={() => setCitationPage((page) => Math.max(1, page - 1))} disabled={safeCitationPage <= 1}>Previous</button>
              <strong>{safeCitationPage} / {citationPageCount}</strong>
              <button type="button" onClick={() => setCitationPage((page) => Math.min(citationPageCount, page + 1))} disabled={safeCitationPage >= citationPageCount}>Next</button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "recommendations" ? (
        <div className="table-wrap users-table full-width-table">
          <table>
            <thead>
              <tr>
                <th>Recommendation</th>
                <th>Type</th>
                <th>Engine</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((item) => (
                <tr key={item.id || `${item.type}-${item.priority}`}>
                  <td><strong>{item.group || item.type || "Recommendation"}</strong></td>
                  <td>{item.type || item.checkerType || "N/A"}</td>
                  <td>{item.engine || "all"}</td>
                  <td>{formatCell(item.priority ?? item.score)}</td>
                  <td>{formatCell(item.state || item.status || "suggested")}</td>
                  <td style={{ minWidth: "320px" }}>{jsonPreview(item.data || {})}</td>
                </tr>
              ))}
              {!recommendations.length ? tableEmpty(6, "No recommendations synced yet.") : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === "brands" ? (
        <div className="brands-workspace">
          <div className="prompt-page-header">
            <div>
              <p className="prompt-breadcrumb">Brand intelligence / {dashboard?.brand || "Brand"}</p>
              <h2>Brand visibility</h2>
              <p className="muted-text">Compare the tracked brand with companies appearing across AI answers.</p>
            </div>
          </div>

          <div className="brand-summary-grid">
            <div className="brand-identity-card">
              <span className="brand-logo-large">
                {dashboard?.brandDomain ? <img src={competitorLogoUrl({ domain: dashboard.brandDomain })} alt="" /> : <Building size={22} />}
              </span>
              <div><span>Tracked brand</span><strong>{dashboard?.brand || "N/A"}</strong><small>{dashboard?.brandDomain || "No domain"}</small></div>
            </div>
            <div className="brand-metric-card"><Users size={18} /><span>Configured competitors</span><strong>{dashboard?.competitors?.length || 0}</strong></div>
            <div className="brand-metric-card"><Award size={18} /><span>Brands detected</span><strong>{detectedBrands.length}</strong></div>
            <div className="brand-metric-card"><Globe size={18} /><span>Markets tracked</span><strong>{dashboard?.countries?.length || 0}</strong></div>
          </div>

          <section className="brand-section">
            <div className="brand-section-heading"><div><h3>AI visibility ranking</h3><p>Brand mentions, share of voice, coverage, and Otterly visibility scores.</p></div></div>
            <div className="brand-table-wrap">
              <table className="brand-table">
                <thead><tr><th>Rank</th><th>Brand</th><th>Mentions</th><th>Share of voice</th><th>Coverage</th><th>Visibility</th></tr></thead>
                <tbody>
                  {brandRankings.map((item) => {
                    const visibility = visibilityByBrand.get(normalizeBrandKey(item.brand));
                    const competitor = resolveCompetitor({ brand: item.brand, domain: item.isMainBrand ? dashboard?.brandDomain : "" });
                    return (
                      <tr key={item.brand} className={item.isMainBrand ? "main-brand-row" : ""}>
                        <td><span className="brand-rank">{item.rank ?? "-"}</span></td>
                        <td><div className="brand-name-cell"><span className="brand-logo-small"><Building size={13} />{competitorLogoUrl(competitor) ? <img src={competitorLogoUrl(competitor)} alt="" /> : null}</span><div><strong>{item.brand}</strong>{item.isMainBrand ? <small>Your brand</small> : null}</div></div></td>
                        <td><strong>{item.mentions ?? 0}</strong></td>
                        <td>{Number(item.shareOfVoice || 0).toFixed(0)}%</td>
                        <td><div className="brand-coverage"><span><i style={{ width: `${Math.min(100, Number(item.brandCoverage || 0))}%` }} /></span><strong>{Number(item.brandCoverage || 0).toFixed(0)}%</strong></div></td>
                        <td>{visibility?.visibilityScore ?? "N/A"}</td>
                      </tr>
                    );
                  })}
                  {!brandRankings.length ? tableEmpty(6, "No brand visibility ranking synced yet.") : null}
                </tbody>
              </table>
            </div>
          </section>

          <div className="brand-detail-grid">
            <section className="brand-section">
              <div className="brand-section-heading"><div><h3>Configured competitors</h3><p>Brands monitored alongside {dashboard?.brand || "your brand"}.</p></div></div>
              <div className="competitor-directory">
                {(dashboard?.competitors || []).map((competitor) => (
                  <div className="competitor-directory-row" key={competitor.brand}>
                    <span className="brand-logo-small"><Building size={13} />{competitorLogoUrl(competitor) ? <img src={competitorLogoUrl(competitor)} alt="" /> : null}</span>
                    <div><strong>{competitor.brand}</strong><small>{competitor.brandDomain || "No domain"}</small></div>
                    <ExternalLink size={14} />
                  </div>
                ))}
                {!dashboard?.competitors?.length ? <p className="brand-empty">No competitors configured.</p> : null}
              </div>
            </section>
            <section className="brand-section">
              <div className="brand-section-heading"><div><h3>Other detected brands</h3><p>Additional names found in AI responses.</p></div></div>
              <div className="detected-brand-list">
                {detectedBrands.slice(0, 10).map((brand, index) => <div key={brand.name}><span>{index + 1}</span><strong>{brand.name}</strong><small>{brand.mentions} mentions</small></div>)}
                {!detectedBrands.length ? <p className="brand-empty">No additional brands detected.</p> : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === "audits" ? (
        <div className="geo-tools-workspace">
          <div className="prompt-page-header">
            <div>
              <p className="prompt-breadcrumb">GEO Audits / {dashboard?.brand || "Brand"}</p>
              <h2>GEO audit tools</h2>
              <p className="muted-text">Run crawlability and AI-readiness checks through the connected Otterly workspace.</p>
            </div>
          </div>

          {/* New Modern Summary Widgets */}
          <div className="geo-header-stats-grid">
            <div className="geo-stat-card">
              <div className="geo-stat-icon blue">
                <Shield size={20} />
              </div>
              <div className="geo-stat-details">
                <span>Total Audits Performed</span>
                <strong>{crawlability.length + content.length}</strong>
              </div>
            </div>

            <div className="geo-stat-card">
              <div className="geo-stat-icon green">
                <CheckCircle size={20} />
              </div>
              <div className="geo-stat-details">
                <span>Crawl Success Rate</span>
                <strong>{crawlSuccessRate === null ? "N/A" : `${crawlSuccessRate}%`}</strong>
              </div>
            </div>

            <div className="geo-stat-card">
              <div className="geo-stat-icon purple">
                <Activity size={20} />
              </div>
              <div className="geo-stat-details">
                <span>Avg Readability Index</span>
                <strong>{averageReadability === null ? "N/A" : `${averageReadability}/100`}</strong>
              </div>
            </div>
          </div>

          {auditNotice ? (
            <div className="audit-notice-alert">
              <AlertCircle size={18} />
              <span>{auditNotice}</span>
            </div>
          ) : null}

          <div className="geo-tool-grid">
            <div className="geo-tool-card crawl-card">
              <div className="geo-tool-card-header">
                <Shield size={18} className="icon-teal" />
                <h4>Crawlability Checker</h4>
              </div>
              <p>Check whether a page can be crawled by AI search bots and identify robots.txt configuration or server permission issues.</p>
              <div className="geo-tool-form">
                <div className="geo-input-wrapper">
                  <Globe size={16} className="geo-input-icon" />
                  <input
                    value={crawlabilityUrl}
                    onChange={(event) => setCrawlabilityUrl(event.target.value)}
                    placeholder="https://example.com/target-page"
                  />
                </div>
                <button
                  type="button"
                  className="geo-submit-btn"
                  onClick={() => runGeoAudit("crawlability")}
                  disabled={!crawlabilityUrl || auditSubmitting === "crawlability"}
                >
                  {auditSubmitting === "crawlability" ? (
                    <>
                      <RefreshCcw size={16} className="spinner" />
                      Auditing Access...
                    </>
                  ) : (
                    "Start Crawl Audit"
                  )}
                </button>
              </div>
            </div>

            <div className="geo-tool-card content-card">
              <div className="geo-tool-card-header">
                <Activity size={18} className="icon-purple" />
                <h4>Content Checker</h4>
              </div>
              <p>Evaluate page structure, HTML semantics, and dynamic element hydration to score local SGE / AI-readiness.</p>
              <div className="geo-tool-form">
                <div className="geo-input-wrapper">
                  <Globe size={16} className="geo-input-icon" />
                  <input
                    value={contentUrl}
                    onChange={(event) => setContentUrl(event.target.value)}
                    placeholder="https://example.com/target-page"
                  />
                </div>
                
                <div>
                  <div className="crawler-select-label">Crawler bot identity</div>
                  <div className="crawler-badge-selector">
                    {[
                      { value: "ChatGPT-User", name: "ChatGPT User", detail: "OpenAI user agent", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
                      { value: "OAI-SearchBot", name: "OAI SearchBot", detail: "OpenAI search bot", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
                      { value: "PerplexityCrawler", name: "Perplexity", detail: "Perplexity crawler", icon: "https://cdn.simpleicons.org/perplexity/1f2937" },
                      { value: "GoogleBot", name: "GoogleBot", detail: "Google crawling bot", icon: "https://cdn.simpleicons.org/google" }
                    ].map((bot) => (
                      <div
                        key={bot.value}
                        className={`crawler-badge ${contentCrawler === bot.value ? "active" : ""}`}
                        onClick={() => setContentCrawler(bot.value)}
                      >
                        <div className="crawler-badge-logo">
                          <img src={bot.icon} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        </div>
                        <div className="crawler-badge-info">
                          <strong>{bot.name}</strong>
                          <span>{bot.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="geo-submit-btn"
                  onClick={() => runGeoAudit("content")}
                  disabled={!contentUrl || auditSubmitting === "content"}
                >
                  {auditSubmitting === "content" ? (
                    <>
                      <RefreshCcw size={16} className="spinner" />
                      Analyzing Readiness...
                    </>
                  ) : (
                    "Start Content Check"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="geo-history-grid">
            <div className="geo-history-card">
              <div className="geo-history-card-header">
                <h3>Crawlability analysis history</h3>
              </div>
              <div className="table-wrap">
                <table className="geo-history-table">
                  <thead>
                    <tr>
                      <th>Target Webpage URL</th>
                      <th>Crawl Status</th>
                      <th>Robots.txt Permission</th>
                      <th>AI Bots Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crawlability.map((check) => {
                      const isExpanded = expandedCrawlId === (check.id || check.url);
                      const totalBots = check.serverBotAccess ? Object.keys(check.serverBotAccess).length : 0;
                      const allowedBots = check.serverBotAccess
                        ? Object.values(check.serverBotAccess).filter(b => b.ok).length
                        : 0;
                      return (
                        <React.Fragment key={check.id || check.url}>
                          <tr
                            className={`geo-history-row ${isExpanded ? "expanded" : ""}`}
                            onClick={() => setExpandedCrawlId(isExpanded ? null : (check.id || check.url))}
                          >
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe size={14} style={{ color: '#64748b' }} />
                                <a href={check.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                  {check.url}
                                </a>
                              </span>
                            </td>
                            <td>
                              <span className={`geo-status-pill ${(check.status || "pending").toLowerCase()}`}>
                                {check.status || "pending"}
                              </span>
                            </td>
                            <td>
                              {check.robotsTxtAnalysisResult === undefined ? (
                                <span className="muted-text">N/A</span>
                              ) : check.robotsTxtAnalysisResult ? (
                                <span style={{ color: '#10b981', fontWeight: 700 }}>Allowed</span>
                              ) : (
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>Blocked</span>
                              )}
                            </td>
                            <td>
                              <strong>
                                {totalBots ? `${allowedBots}/${totalBots} allowed` : "N/A"}
                              </strong>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="geo-detail-expansion-row">
                              <td colSpan={4}>
                                <div className="geo-detail-expansion-content">
                                  <div className="expanded-detail-grid">
                                    <div className="detail-card-panel">
                                      <h4><Shield size={14} style={{ color: '#10b981' }} /> AI Search Bot Access Permissions</h4>
                                      <div className="bots-permission-grid">
                                        {check.serverBotAccess && Object.keys(check.serverBotAccess).length > 0 ? (
                                          Object.entries(check.serverBotAccess).map(([botName, botVal]) => (
                                            <div className="bot-permission-card" key={botName}>
                                              <div className="bot-name-wrap">
                                                <Bot size={13} style={{ color: '#5c6cf2' }} />
                                                <strong>{botName}</strong>
                                              </div>
                                              <span className={`bot-access-dot ${botVal.ok ? "allowed" : "blocked"}`}>
                                                {botVal.ok ? "Allowed" : "Blocked"}
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="geo-empty-state">
                                            <Bot size={28} />
                                            <span>No bot access logs found</span>
                                            <p>This crawler status analysis does not contain granular user-agent records.</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="detail-card-panel">
                                      <h4><FileText size={14} style={{ color: '#8b5cf6' }} /> Robots.txt parsing rules</h4>
                                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', lineHeight: 1.4 }}>
                                        {check.robotsTxtAnalysisResult === undefined
                                          ? "Crawl index analysis missing."
                                          : check.robotsTxtAnalysisResult
                                          ? "Crawl status: OK. AI Crawler agents are fully authorized to access and index this webpage content according to robots.txt."
                                          : "Crawl status: BLOCKED. Your robots.txt file configuration restricts AI crawlers from accessing this URL."}
                                      </p>
                                      <pre className="robots-box">
                                        {`# Robots.txt file permissions\nUser-agent: ChatGPT-User\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: *\nDisallow: /admin/`}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {!crawlability.length ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="geo-empty-state">
                            <Shield size={36} />
                            <span>No crawlability checks synced yet</span>
                            <p>Verify crawl permissions by starting your first crawl audit above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="geo-history-card">
              <div className="geo-history-card-header">
                <h3>Content structure check history</h3>
              </div>
              <div className="table-wrap">
                <table className="geo-history-table">
                  <thead>
                    <tr>
                      <th>Target Webpage URL</th>
                      <th>Audit Status</th>
                      <th>Semantic Score</th>
                      <th>Dynamic Hydration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.map((check) => {
                      const isExpanded = expandedContentId === (check.id || check.url);
                      const overall = check.structuralAnalysis?.overallScore || 0;
                      const dynamic = check.dynamicContent?.score || 0;
                      const overallColor = overall >= 80 ? "#10b981" : overall >= 50 ? "#f59e0b" : "#ef4444";
                      const dynamicColor = dynamic >= 80 ? "#10b981" : dynamic >= 50 ? "#f59e0b" : "#ef4444";

                      return (
                        <React.Fragment key={check.id || check.url}>
                          <tr
                            className={`geo-history-row ${isExpanded ? "expanded" : ""}`}
                            onClick={() => setExpandedContentId(isExpanded ? null : (check.id || check.url))}
                          >
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe size={14} style={{ color: '#64748b' }} />
                                <a href={check.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                  {check.url}
                                </a>
                              </span>
                            </td>
                            <td>
                              <span className={`geo-status-pill ${(check.status || "pending").toLowerCase()}`}>
                                {check.status || "pending"}
                              </span>
                            </td>
                            <td>
                              <strong>{overall ? `${overall}/100` : "N/A"}</strong>
                            </td>
                            <td>
                              <strong>{dynamic ? `${dynamic}/100` : "N/A"}</strong>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="geo-detail-expansion-row">
                              <td colSpan={4}>
                                <div className="geo-detail-expansion-content">
                                  <div className="expanded-detail-grid">
                                    <div className="detail-card-panel">
                                      <h4><Activity size={14} style={{ color: '#8b5cf6' }} /> AI readiness & readability scores</h4>
                                      <div className="score-wheel-container">
                                        <div className="score-wheel-item">
                                          <div className="score-wheel" style={{ background: `conic-gradient(${overallColor} ${overall * 3.6}deg, #f1f5f9 0deg)` }}>
                                            <div className={`score-wheel-inner ${overall >= 80 ? "high" : overall >= 50 ? "medium" : "low"}`}>
                                              {overall || 0}
                                            </div>
                                          </div>
                                          <span>Structural score</span>
                                        </div>

                                        <div className="score-wheel-item">
                                          <div className="score-wheel" style={{ background: `conic-gradient(${dynamicColor} ${dynamic * 3.6}deg, #f1f5f9 0deg)` }}>
                                            <div className={`score-wheel-inner ${dynamic >= 80 ? "high" : dynamic >= 50 ? "medium" : "low"}`}>
                                              {dynamic || 0}
                                            </div>
                                          </div>
                                          <span>Dynamic score</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="detail-card-panel">
                                      <h4><CheckCircle size={14} style={{ color: '#10b981' }} /> Semantic structural checks</h4>
                                      <div className="content-checklist">
                                        <div className="content-checklist-item">
                                          <span>Header hierarchy structure</span>
                                          <strong className={check.structuralAnalysis?.headingsStructureScore >= 80 ? "good" : "attention"}>
                                            {check.structuralAnalysis?.headingsStructureScore ? `${check.structuralAnalysis.headingsStructureScore}%` : "Passed"}
                                          </strong>
                                        </div>
                                        <div className="content-checklist-item">
                                          <span>Semantic HTML elements</span>
                                          <strong className={check.structuralAnalysis?.semanticHtmlScore >= 80 ? "good" : "attention"}>
                                            {check.structuralAnalysis?.semanticHtmlScore ? `${check.structuralAnalysis.semanticHtmlScore}%` : "Passed"}
                                          </strong>
                                        </div>
                                        <div className="content-checklist-item">
                                          <span>Unique element IDs</span>
                                          <strong className={check.structuralAnalysis?.uniqueIdsScore >= 80 ? "good" : "attention"}>
                                            {check.structuralAnalysis?.uniqueIdsScore ? `${check.structuralAnalysis.uniqueIdsScore}%` : "Passed"}
                                          </strong>
                                        </div>
                                        <div className="content-checklist-item">
                                          <span>Dynamic hydration status</span>
                                          <strong className={check.dynamicContent?.hydrationSuccess ? "good" : "attention"}>
                                            {check.dynamicContent?.hydrationSuccess ? "Success" : "Failed"}
                                          </strong>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {!content.length ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="geo-empty-state">
                            <Activity size={36} />
                            <span>No content checks synced yet</span>
                            <p>Verify page structures and HTML tags by starting a content readiness check above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "account" ? (
        <div className="role-grid">
          {user.role === "DEVELOPER" && canSync ? (
            <div className="role-card double-width-card developer-sync-card">
              <div>
                <div className="role-card-header"><RefreshCcw size={16} className="icon-blue" /><h4>Developer sync control</h4></div>
                <p className="muted-text">Refresh Otterly data for the selected company from the integration account. This keeps live data out of normal client tabs.</p>
              </div>
              <button
                type="button"
                className="developer-sync-button"
                onClick={async () => {
                  setSyncingOtterly(true);
                  try {
                    await onSync();
                  } finally {
                    setSyncingOtterly(false);
                  }
                }}
                disabled={syncingOtterly || !selectedAccountId}
              >
                <RefreshCcw size={15} />
                {syncingOtterly ? "Refreshing..." : "Refresh Otterly data"}
              </button>
            </div>
          ) : null}
          <div className="role-card double-width-card account-usage-card">
            <div className="role-card-header"><Cpu size={16} className="icon-blue" /><h4>Otterly account usage</h4></div>
            <div className="account-plan-line"><span>Plan</span><strong>{accountInfo.subscriptionPlan || "N/A"}</strong><small>{accountInfo.subscriptionEndDate ? `Renews ${new Date(accountInfo.subscriptionEndDate).toLocaleDateString()}` : "End date unavailable"}</small></div>
            <div className="usage-meter-grid">
              {[
                ["REST API requests", accountInfo.apiRequestsUsedCount, accountInfo.apiRequestsMaxCount],
                ["MCP requests", accountInfo.mcpRequestsUsedCount, accountInfo.mcpRequestsMaxCount],
                ["Tracked prompts", accountInfo.promptsUsedCount, accountInfo.promptsMaxCount],
                ["GEO audits", accountInfo.geoAuditUsedCount, accountInfo.geoAuditMaxCount]
              ].map(([label, used, maximum]) => (
                <div className="usage-meter" key={label}>
                  <div><span>{label}</span><strong>{used ?? 0} / {maximum ?? 0}</strong></div>
                  <span className="usage-meter-track"><i style={{ width: `${usagePercent(used, maximum)}%` }} /></span>
                </div>
              ))}
            </div>
          </div>
          <div className="role-card double-width-card sync-status-card">
            <div className="role-card-header"><RefreshCcw size={16} className="icon-teal" /><h4>Sync status</h4></div>
            <div className="stat-group">
              <div className="stat-row"><span>Status</span><strong>{data?.latestSync?.status || "N/A"}</strong></div>
              <div className="stat-row"><span>Started</span><strong>{data?.latestSync?.startedAt ? new Date(data.latestSync.startedAt).toLocaleString() : "N/A"}</strong></div>
              <div className="stat-row"><span>Completed</span><strong>{data?.latestSync?.completedAt ? new Date(data.latestSync.completedAt).toLocaleString() : "N/A"}</strong></div>
              <div className="stat-row"><span>Workspace</span><strong>{data?.latestSync?.workspaceId || "N/A"}</strong></div>
              <div className="stat-row"><span>Report</span><strong>{data?.latestSync?.reportId || "N/A"}</strong></div>
            </div>
          </div>
          <div className="role-card double-width-card citation-coverage-card">
            <div className="role-card-header"><Database size={16} className="icon-gold" /><h4>Citation coverage</h4></div>
            <p className="muted-text">Otterly's citation statistics for the tracked brand domain across the current report window.</p>
            <div className="citation-coverage-metrics">
              <div><span>Your domain citations</span><strong>{citationDomainStats.current ?? 0}</strong></div>
              <div><span>Total citations observed</span><strong>{citationDomainStats.total ?? 0}</strong></div>
              <div><span>Citation share</span><strong>{Number(citationDomainStats.citationShare || 0).toFixed(1)}%</strong></div>
              <div><span>Ranked domains</span><strong>{rankedCitationDomains.length}</strong></div>
            </div>
          </div>
        </div>
      ) : null}

    </section>

      {selectedPrompt ? (
        <div className="prompt-drawer-overlay">
          <button
            type="button"
            aria-label="Close prompt details"
            className="prompt-drawer-backdrop"
            onClick={() => {
              setSelectedPromptId(null);
              setSelectedResponseIndex(null);
            }}
          />
          <aside className="prompt-drawer">
            <div className="prompt-drawer-sticky">
              <div className="prompt-drawer-header">
                <div className="prompt-drawer-title">
                  <span><MessageSquare size={18} /></span>
                  <div>
                    <h3>Prompt details</h3>
                    <p>Responses, brand presence, and citations from Otterly</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="prompt-close-button"
                  onClick={() => {
                    setSelectedPromptId(null);
                    setSelectedResponseIndex(null);
                  }}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="prompt-context-card">
                <div>
                  <span><MessageSquare size={13} /> Prompt</span>
                  <p>{promptLabel(selectedPrompt, selectedPromptDetail)}</p>
                </div>
                <strong>Last 14 days</strong>
              </div>
              <div className="prompt-drawer-tabs">
                {["overview", "responses"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setPromptDrawerTab(tab);
                      if (tab === "responses") setSelectedResponseIndex(null);
                    }}
                    className={promptDrawerTab === tab ? "active" : ""}
                  >
                    {tab === "overview" ? <FileText size={15} /> : <Bot size={15} />}
                    {tab === "overview" ? "Overview" : "Responses"}
                  </button>
                ))}
              </div>
            </div>

            <div className="prompt-drawer-body">
              {promptDrawerTab === "overview" ? (
                <div className="prompt-overview">
                  <div className="prompt-overview-cards">
                    <div className="prompt-info-card">
                      <span>Country</span>
                      <strong>{dashboard?.countries?.[0]?.toUpperCase() === "US" ? "United States" : dashboard?.countries?.[0] || "N/A"}</strong>
                    </div>
                    <div className="prompt-info-card">
                      <span>Tags</span>
                      <strong>{formatCell(selectedPromptDetail.tags || selectedPrompt.tags || [], "N/A")}</strong>
                    </div>
                    <div className="prompt-info-card">
                      <span>Intent Volume</span>
                      <div className="intent-meter large">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={index} className={index < Math.max(1, Math.min(5, Number(selectedPrompt.volume ?? selectedPromptDetail.intentVolume ?? 0))) ? "active" : ""} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="prompt-overview-section">
                    <h4>Brand Coverage Over Time</h4>
                    {selectedPromptCoverageHistory.length ? (
                      <div className="coverage-history-list">
                        {selectedPromptCoverageHistory.map((item, index) => (
                          <div className="coverage-history-row" key={`${item.brand}-${item.date}-${index}`}>
                            <span>{item.date ? new Date(item.date).toLocaleDateString() : item.brand || "Coverage"}</span>
                            <div><i style={{ width: `${Math.min(100, Number(item.coverage || 0))}%` }} /></div>
                            <strong>{Number(item.coverage || 0).toFixed(0)}%</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overview-empty-state">
                        <Database size={42} />
                        <span>No data to display.</span>
                      </div>
                    )}
                  </div>

                  <div className="prompt-overview-section">
                    <h4>Brand Ranking</h4>
                    <div className="prompt-table-card compact">
                      <table className="prompt-table prompt-ranking-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Brand Name</th>
                            <th>Sentiment</th>
                            <th>Brand Coverage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPromptBrandRank.map((rankItem) => (
                            <tr key={`${rankItem.rank}-${rankItem.brand}`}>
                              <td>{rankItem.rank ?? "-"}</td>
                              <td><strong>{rankItem.brand || "Unknown"}</strong></td>
                              <td>{sentimentLabel(rankItem.sentiment)}</td>
                              <td>{rankItem.brandCoverage !== undefined ? `${Number(rankItem.brandCoverage).toFixed(0)}%` : "N/A"}</td>
                            </tr>
                          ))}
                          {!selectedPromptBrandRank.length ? tableEmpty(4, "No brand ranking data synced for this prompt.") : null}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="prompt-overview-section">
                    <h4>Domain Categories Distribution</h4>
                    {selectedPromptCategories.length ? (
                      <div className="domain-distribution">
                        <div className="domain-pie" style={{ background: `conic-gradient(${categoryGradient})` }} />
                        <div className="domain-category-list">
                          {selectedPromptCategories.map((category, index) => {
                            const percent = totalPromptCategories ? Math.round((Number(category.value || 0) / totalPromptCategories) * 100) : 0;
                            return (
                              <div className="domain-category-row" key={category.category}>
                                <span style={{ background: categoryColors[index % categoryColors.length] }} />
                                <strong>{category.category}</strong>
                                <em>{percent}% ({category.value})</em>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="overview-empty-state compact">
                        <Database size={34} />
                        <span>No data</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {promptDrawerTab === "responses" && selectedResponse === null ? (
                <div className="prompt-response-list">
                  <h3>AI Search Engine Responses</h3>
                  <div className="prompt-table-card compact">
                    <table className="prompt-table prompt-response-table">
                      <thead>
                        <tr>
                          <th>AI Responses</th>
                          <th>Brand Mentioned</th>
                          <th>Brand Sentiment</th>
                          <th>Competitors</th>
                          <th>Run Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPromptResponses.map((response, index) => (
                          <tr key={`${response.engine}-${response.runId}-${index}`} className="prompt-table-row" onClick={() => setSelectedResponseIndex(index)}>
                            <td className="prompt-response-cell">
                              <span className="engine-badge">{engineLogo(response.engine)}{engineLabel(response.engine)}</span>{" "}
                              {String(response.content || "No response content").slice(0, 86)}...
                            </td>
                            <td><span className={response.brandMentions?.length ? "prompt-status-pill positive" : "prompt-status-pill negative"}>{response.brandMentions?.length ? "Yes" : "No"}</span></td>
                            <td>{formatCell(response.brandMentions?.[0]?.sentiment, "N/A")}</td>
                            <td>{formatCell(response.competitors || [], "N/A")}</td>
                            <td>{response.runDate ? new Date(response.runDate).toLocaleDateString() : "N/A"}</td>
                          </tr>
                        ))}
                        {!selectedPromptResponses.length ? tableEmpty(5, "No AI responses synced for this prompt.") : null}
                      </tbody>
                    </table>
                  </div>
                  <p className="prompt-result-count">Viewing {selectedPromptResponses.length ? `1-${selectedPromptResponses.length}` : "0"} of {selectedPromptResponses.length} results</p>
                </div>
              ) : null}

              {promptDrawerTab === "responses" && selectedResponse !== null ? (
                <div className="prompt-response-layout">
                  <div className="prompt-answer-column">
                    <button className="prompt-back-button" onClick={() => setSelectedResponseIndex(null)}>
                      <ChevronLeft size={16} />
                      Back to responses
                      <span>{engineLogo(selectedResponse.engine)}{engineLabel(selectedResponse.engine)}</span>
                    </button>
                    <p className="prompt-question-card">{promptLabel(selectedPrompt, selectedPromptDetail)}</p>
                    <article className="prompt-answer-card">
                      {selectedResponse.content || "No response content synced."}
                    </article>
                  </div>
                  <aside className="prompt-side-panel">
                    <div className="prompt-panel-card">
                      <div className="role-card-header"><Building size={15} /><h4>Brand Presence & Sentiment</h4></div>
                      <div className="stat-row"><span>{dashboard?.brand || "Brand"}</span><strong>{selectedResponse.brandMentions?.length ? "Mentioned" : "Not mentioned"}</strong></div>
                    </div>
                    <div className="prompt-panel-card">
                      <div className="role-card-header"><Globe size={15} /><h4>Sources</h4></div>
                      <div className="prompt-source-list">
                        {(selectedResponse.citations || []).slice(0, 8).map((citation) => (
                          <a key={`${citation.rank}-${citation.link}`} href={citation.link} target="_blank" rel="noreferrer">
                            <strong>{citation.rank}. {citation.title || citation.link}<ExternalLink size={12} /></strong>
                            <span>{citation.link}</span>
                          </a>
                        ))}
                        {!selectedResponse.citations?.length ? <p className="muted-text">No citations available.</p> : null}
                      </div>
                    </div>
                  </aside>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

    </>
  );
}

const integrationPlatforms = [
  {
    key: "otterly",
    name: "OtterlyAI",
    iconClass: "icon-servicetitan",
    initials: "OT",
    description: "Sync real AI search visibility, prompts, citations, recommendations, and GEO audit data from OtterlyAI."
  },
  {
    key: "servicetitan",
    name: "ServiceTitan",
    iconClass: "icon-servicetitan",
    initials: "ST",
    description: "Sync commercial dispatch schedules, technicians, and invoice tracking metrics automatically."
  },
  {
    key: "housecall",
    name: "Housecall Pro",
    iconClass: "icon-housecall",
    initials: "HP",
    description: "Import residential customer service histories, job estimates, and dispatch routes seamlessly."
  },
  {
    key: "servicetrade",
    name: "ServiceTrade",
    iconClass: "icon-servicetrade",
    initials: "SR",
    description: "Automatically sync mechanical contracting jobs, service tickets, and commercial system metrics."
  },
  {
    key: "jobber",
    name: "Jobber",
    iconClass: "icon-jobber",
    initials: "JB",
    description: "Import operations scheduling, invoice templates, customer quotes, and tracking data."
  }
];

function Dashboard({ user, onLogout, onUserUpdate }) {
  const [records, setRecords] = useState([]);
  const [otterlyData, setOtterlyData] = useState(null);
  const [otterlyTab, setOtterlyTab] = useState("overview");
  const [accounts, setAccounts] = useState(() => user.role === "DEVELOPER" ? [] : user.account ? [user.account] : []);
  const [managedUsers, setManagedUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(() => user.role === "DEVELOPER" ? "" : user.accountId ?? "");
  const [activeView, setActiveView] = useState(() => localStorage.getItem("cortexy_activeView") || "dashboard");
  const [settingsTab, setSettingsTab] = useState(() => {
    const saved = localStorage.getItem("cortexy_settingsTab");
    if (saved) return saved;
    return user.role === "SUPER_ADMIN" || user.role === "BUSINESS_OWNER" ? "users" : "personal";
  });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [userForm, setUserForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: (user.role === "SUPER_ADMIN" || user.role === "DEVELOPER") ? "BUSINESS_OWNER" : "MARKETING_MANAGER",
    accountId: user.accountId ?? "",
    companyName: "",
    adminId: "",
    branchId: ""
  });

  // Company Registration States
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [newCompName, setNewCompName] = useState("");
  const [newCompSlug, setNewCompSlug] = useState("");
  const [newCompTagline, setNewCompTagline] = useState("");
  const [newCompAddr1, setNewCompAddr1] = useState("");
  const [newCompAddr2, setNewCompAddr2] = useState("");
  const [newCompCity, setNewCompCity] = useState("");
  const [newCompState, setNewCompState] = useState("");
  const [newCompCountry, setNewCompCountry] = useState("");
  const [newCompZipcode, setNewCompZipcode] = useState("");
  const [newCompAdmin, setNewCompAdmin] = useState("");
  const [newCompPhone, setNewCompPhone] = useState("");
  const [newCompTimezone, setNewCompTimezone] = useState("America/Toronto");
  const [newCompLocale, setNewCompLocale] = useState("en-CA");
  const [newCompLanguage, setNewCompLanguage] = useState("English");
  const [newCompCurrency, setNewCompCurrency] = useState("CAD");
  const [newCompBranchName, setNewCompBranchName] = useState("");
  const [userMgmtCompanyFilter, setUserMgmtCompanyFilter] = useState(() => user.role === "DEVELOPER" ? "all" : user.accountId ?? "");
  const [userMgmtViewMode, setUserMgmtViewMode] = useState("tree");

  // Self update states
  const [selfName, setSelfName] = useState(user.name);
  const [selfPassword, setSelfPassword] = useState("");
  const [selfSaving, setSelfSaving] = useState(false);
  const [companyName, setCompanyName] = useState(user.account?.name ?? "");
  const [companySlug, setCompanySlug] = useState(user.account?.slug ?? "");
  const [companyTagline, setCompanyTagline] = useState(user.account?.tagline ?? "");
  const [billingAddressLine1, setBillingAddressLine1] = useState(user.account?.billingAddressLine1 ?? "");
  const [billingAddressLine2, setBillingAddressLine2] = useState(user.account?.billingAddressLine2 ?? "");
  const [city, setCity] = useState(user.account?.city ?? "");
  const [state, setState] = useState(user.account?.state ?? "");
  const [country, setCountry] = useState(user.account?.country ?? "");
  const [zipcode, setZipcode] = useState(user.account?.zipcode ?? "");
  const [administrator, setAdministrator] = useState(user.account?.administrator ?? "");
  const [cellphone, setCellphone] = useState(user.account?.cellphone ?? "");
  const [timezone, setTimezone] = useState(user.account?.timezone ?? "America/Toronto");
  const [locale, setLocale] = useState(user.account?.locale ?? "en-CA");
  const [language, setLanguage] = useState(user.account?.language ?? "English");
  const [currency, setCurrency] = useState(user.account?.currency ?? "CAD");

  // Integrations states (scoped to selected workspace)
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);
  const [integrationOverview, setIntegrationOverview] = useState([]);
  const [activeConnectingPlatform, setActiveConnectingPlatform] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({
    apiKey: "",
    workspaceId: "",
    brandReportId: "",
    brand: "",
    brandDomain: "",
    defaultCountry: "us",
    clientId: "",
    clientSecret: "",
    syncInterval: "1h",
    sandbox: true
  });

  const activeIntegrationAccountId = user.role === "DEVELOPER"
    ? selectedAccountId
    : user.accountId;

  async function loadIntegrations(accountId = activeIntegrationAccountId) {
    if (!accountId || !canManageCompany) {
      setConnectedIntegrations([]);
      return;
    }

    const data = await apiRequest(`/accounts/${accountId}/integrations`);
    setConnectedIntegrations(data.integrations);
  }

  async function loadIntegrationOverview() {
    if (user.role !== "DEVELOPER") return;
    const data = await apiRequest("/accounts/integrations");
    setIntegrationOverview(data.overview || []);
  }

  useEffect(() => {
    loadIntegrations();
  }, [activeIntegrationAccountId]);

  useEffect(() => {
    loadIntegrationOverview();
  }, [accounts.length]);

  const handleConnectIntegration = async (e) => {
    e.preventDefault();
    if (!activeConnectingPlatform) return;

    if (!activeIntegrationAccountId) {
      setNotice("Select a company before connecting an integration.");
      return;
    }

    const platformName = activeConnectingPlatform.name;
    try {
      const result = await apiRequest(`/accounts/${activeIntegrationAccountId}/integrations/${activeConnectingPlatform.key}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "connected",
          config: integrationForm
        }),
        timeoutMs: activeConnectingPlatform.key === "otterly" ? 60000 : 15000
      });

      setActiveConnectingPlatform(null);
      setIntegrationForm({
        apiKey: "",
        workspaceId: "",
        brandReportId: "",
        brand: "",
        brandDomain: "",
        defaultCountry: "us",
        clientId: "",
        clientSecret: "",
        syncInterval: "1h",
        sandbox: true
      });
      await loadIntegrations(activeIntegrationAccountId);
      await loadIntegrationOverview();
      const discoveredReport = result.integration?.config?.brandReportId;
      if (activeConnectingPlatform.key === "otterly") {
        setNotice(`${platformName} connected. Importing the first data snapshot...`);
        await handleSync(activeIntegrationAccountId);
      } else {
        setNotice(discoveredReport
          ? `${platformName} connected. Brand Report ${discoveredReport} was assigned automatically.`
          : `${platformName} connected successfully.`);
      }
    } catch (error) {
      setNotice(error.message || `Failed to connect ${platformName}.`);
    }
  };

  const handleDisconnectIntegration = async (platformKey, platformName) => {
    if (!activeIntegrationAccountId) {
      setNotice("Select a company before disconnecting an integration.");
      return;
    }

    await apiRequest(`/accounts/${activeIntegrationAccountId}/integrations/${platformKey}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "disconnected",
        config: {}
      })
    });

    await loadIntegrations(activeIntegrationAccountId);
    await loadIntegrationOverview();
    setNotice(`${platformName} disconnected.`);
  };

  async function handleCreateCompany(e) {
    e.preventDefault();
    setNotice("");
    try {
      const payload = {
        name: newCompName,
        slug: newCompSlug,
        tagline: newCompTagline || undefined,
        billingAddressLine1: newCompAddr1,
        billingAddressLine2: newCompAddr2 || undefined,
        city: newCompCity,
        state: newCompState,
        country: newCompCountry,
        zipcode: newCompZipcode,
        administrator: newCompAdmin,
        cellphone: newCompPhone || undefined,
        timezone: newCompTimezone,
        locale: newCompLocale,
        language: newCompLanguage,
        currency: newCompCurrency,
        branchName: newCompBranchName || undefined
      };

      const data = await apiRequest("/accounts", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setNewCompName("");
      setNewCompSlug("");
      setNewCompTagline("");
      setNewCompAddr1("");
      setNewCompAddr2("");
      setNewCompCity("");
      setNewCompState("");
      setNewCompCountry("");
      setNewCompZipcode("");
      setNewCompAdmin("");
      setNewCompPhone("");
      setNewCompTimezone("America/Toronto");
      setNewCompLocale("en-CA");
      setNewCompLanguage("English");
      setNewCompCurrency("CAD");
      setNewCompBranchName("");
      setIsCreateCompanyOpen(false);

      setNotice("Successfully registered new company!");
      await loadAccounts();
      if (data.account?.id) {
        setSelectedAccountId(data.account.id);
        await loadIntegrations(data.account.id);
      }
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleDeleteCompany(companyId, companyName) {
    if (!window.confirm(`Are you sure you want to delete ${companyName}? This will delete all its users and branches!`)) return;
    setNotice("");
    try {
      await apiRequest(`/accounts/${companyId}`, {
        method: "DELETE"
      });
      setNotice(`Company ${companyName} was deleted.`);
      if (selectedAccountId === companyId) {
        setSelectedAccountId(accounts[0]?.id || "");
      }
      await loadAccounts();
      await loadUsers();
    } catch (err) {
      setNotice(err.message);
    }
  }

  const canManageCompany = user.role === "SUPER_ADMIN" || user.role === "DEVELOPER" || user.role === "BUSINESS_OWNER";

  useEffect(() => {
    setSelfName(user.name);
  }, [user.name]);

  useEffect(() => {
    const currentCompany = user.role === "DEVELOPER"
      ? accounts.find(a => a.id === selectedAccountId) 
      : user.account;

    if (currentCompany) {
      setCompanyName(currentCompany.name ?? "");
      setCompanySlug(currentCompany.slug ?? "");
      setCompanyTagline(currentCompany.tagline ?? "");
      setBillingAddressLine1(currentCompany.billingAddressLine1 ?? "");
      setBillingAddressLine2(currentCompany.billingAddressLine2 ?? "");
      setCity(currentCompany.city ?? "");
      setState(currentCompany.state ?? "");
      setCountry(currentCompany.country ?? "");
      setZipcode(currentCompany.zipcode ?? "");
      setAdministrator(currentCompany.administrator ?? "");
      setCellphone(currentCompany.cellphone ?? "");
      setTimezone(currentCompany.timezone ?? "America/Toronto");
      setLocale(currentCompany.locale ?? "en-CA");
      setLanguage(currentCompany.language ?? "English");
      setCurrency(currentCompany.currency ?? "CAD");
    }
  }, [selectedAccountId, accounts, user.account]);

  async function handleUpdateSelf(e) {
    e.preventDefault();
    setNotice("");
    setSelfSaving(true);
    try {
      // 1. Update personal details
      const payload = {
        name: selfName,
        password: selfPassword || undefined
      };
      const data = await apiRequest("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      let updatedUser = data.user;

      // 2. Update company details if they are the owner/manager
      const targetCompanyId = user.role === "DEVELOPER"
        ? selectedAccountId 
        : user.accountId;

      if (canManageCompany && targetCompanyId) {
        const companyData = await apiRequest(`/accounts/${targetCompanyId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: companyName,
            slug: companySlug,
            tagline: companyTagline,
            billingAddressLine1,
            billingAddressLine2,
            city,
            state,
            country,
            zipcode,
            administrator,
            cellphone,
            timezone,
            locale,
            language,
            currency
          })
        });
        if (targetCompanyId === user.accountId) {
          updatedUser = {
            ...updatedUser,
            account: companyData.account
          };
        }
      }

      onUserUpdate(updatedUser);
      setNotice("Personal profile and company information updated successfully.");
      setSelfPassword("");
      await loadAccounts();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSelfSaving(false);
    }
  }

  const canSync = user.role === "SUPER_ADMIN" || user.role === "DEVELOPER" || user.role === "BUSINESS_OWNER";
  const canManageAccounts = user.role === "DEVELOPER";
  const canManageUsers = user.role === "SUPER_ADMIN" || user.role === "DEVELOPER" || user.role === "BUSINESS_OWNER";
  const visibleIntegrationPlatforms = user.role === "DEVELOPER"
    ? integrationPlatforms
    : integrationPlatforms.filter((platform) => platform.key !== "otterly");

  async function loadDashboard(accountId = selectedAccountId) {
    setLoading(true);
    try {
      const targetId = user.role === "DEVELOPER" ? accountId : user.accountId;
      if (!targetId) {
        setRecords([]);
        setOtterlyData(null);
        return;
      }
      const query = targetId ? `?accountId=${targetId}` : "";
      const [recordsData, otterlyPayload] = await Promise.all([
        apiRequest(`/dashboard/records${query}`),
        targetId ? apiRequest(`/dashboard/otterly${query}`).catch(() => null) : Promise.resolve(null)
      ]);
      setRecords(recordsData.records);
      setOtterlyData(otterlyPayload);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers(accountId) {
    if (!canManageUsers) return;
    setUsersLoading(true);
    try {
      const targetId = user.role === "DEVELOPER" ? "all" : user.accountId;
      const query = targetId ? `?accountId=${targetId}` : "";
      const data = await apiRequest(`/auth/users${query}`);
      setManagedUsers(data.users);
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadAdmins(accountId = selectedAccountId) {
    if (!canManageUsers) return;
    const targetId = user.role === "DEVELOPER" ? accountId : user.accountId;
    const query = targetId ? `?accountId=${targetId}` : "";
    const data = await apiRequest(`/auth/admins${query}`);
    setAdmins(data.admins);
    setUserForm((current) => ({
      ...current,
      adminId: data.admins.some((admin) => admin.id === current.adminId) ? current.adminId : data.admins[0]?.id ?? ""
    }));
  }

  async function loadBranches(accountId = selectedAccountId || user.accountId) {
    const targetId = user.role === "DEVELOPER" ? accountId : user.accountId;
    if (!targetId) return;
    const query = `?accountId=${targetId}`;
    try {
      const data = await apiRequest(`/auth/branches${query}`);
      setBranches(data.branches || []);
      setUserForm((current) => ({
        ...current,
        branchId: data.branches.some((b) => b.id === current.branchId) ? current.branchId : data.branches[0]?.id ?? ""
      }));
    } catch {
      setBranches([]);
    }
  }

  async function loadAccounts() {
    if (!canManageAccounts) return user.accountId || "";
    const data = await apiRequest("/accounts");
    setAccounts(data.accounts);
    const initialAccountId = selectedAccountId || data.accounts[0]?.id || "";
    if (!selectedAccountId && initialAccountId) {
      setSelectedAccountId(initialAccountId);
      setUserForm((current) => ({ ...current, accountId: current.accountId || initialAccountId }));
    }
    return initialAccountId;
  }

  useEffect(() => {
    async function loadInitialData() {
      const initialAccountId = await loadAccounts();
      await loadDashboard(initialAccountId);
      if (canManageUsers) {
        const initialCompanyFilter = user.role === "DEVELOPER" ? "all" : user.accountId;
        await loadUsers(initialCompanyFilter);
        await loadAdmins(initialAccountId || user.accountId);
        await loadBranches(initialAccountId || user.accountId);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeView === "data") {
      setActiveView("dashboard");
      return;
    }
    localStorage.setItem("cortexy_activeView", activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem("cortexy_settingsTab", settingsTab);
  }, [settingsTab]);

  async function handleSync(accountIdOverride = null) {
    setNotice("");
    const targetAccountId = typeof accountIdOverride === "string" ? accountIdOverride : selectedAccountId;
    const body = user.role === "DEVELOPER" ? { accountId: targetAccountId } : {};

    try {
      const data = await apiRequest("/dashboard/sync", {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 120000
      });
      setNotice(data.provider === "otterly"
        ? `Synced ${data.syncedResources} Otterly resources and ${data.synced} dashboard metrics.`
        : `Synced ${data.synced} records into our database.`);
      await loadDashboard(targetAccountId);
      await loadAccounts();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleSaveUser(event) {
    event.preventDefault();
    setNotice("");

    try {
      const payload = {
        id: userForm.id || undefined,
        name: userForm.name,
        email: userForm.email,
        password: userForm.password || undefined,
        role: userForm.role,
        adminId: userForm.adminId || undefined,
        branchId: userForm.branchId || undefined
      };

      if (userForm.role === "SUPER_ADMIN") {
        payload.companyName = userForm.companyName;
        payload.accountId = userForm.accountId;
      } else {
        payload.accountId = user.role === "DEVELOPER" ? userForm.accountId : user.accountId;
      }

      if (editingUserId) {
        await apiRequest(`/auth/users/${editingUserId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        setNotice(`${roleLabels[payload.role]} updated successfully.`);
      } else {
        const data = await apiRequest("/auth/users", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setNotice(data.message || `${roleLabels[payload.role]} created successfully.`);
        if (payload.role === "SUPER_ADMIN" && data.user?.accountId) {
          setSelectedAccountId(data.user.accountId);
          await loadIntegrations(data.user.accountId);
        }
      }

      setEditingUserId(null);
      setIsDrawerOpen(false);
      setUserForm((current) => ({
        ...current,
        id: "",
        name: "",
        email: "",
        password: "",
        companyName: "",
        adminId: "",
        branchId: ""
      }));
      await loadUsers(userMgmtCompanyFilter || selectedAccountId);
      await loadAdmins(userMgmtCompanyFilter || selectedAccountId);
      await loadBranches(userMgmtCompanyFilter || selectedAccountId || user.accountId);
      await loadAccounts();
    } catch (err) {
      setNotice(err.message);
    }
  }

  function handleEditUser(targetUser) {
    setShowUserPassword(false);
    setEditingUserId(targetUser.id);
    setUserForm({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      password: "",
      role: targetUser.role,
      accountId: targetUser.account?.id ?? targetUser.accountId ?? "",
      companyName: targetUser.account?.name || "",
      adminId: targetUser.admin?.id ?? targetUser.adminId ?? "",
      branchId: targetUser.branch?.id ?? targetUser.branchId ?? ""
    });
    setNotice("");
    setIsDrawerOpen(true);
  }

  function cancelEdit() {
    setShowUserPassword(false);
    setEditingUserId(null);
    setUserForm({
      id: "",
      name: "",
      email: "",
      password: "",
      role: (user.role === "SUPER_ADMIN" || user.role === "DEVELOPER") ? "BUSINESS_OWNER" : "MARKETING_MANAGER",
      accountId: selectedAccountId || user.accountId || "",
      companyName: "",
      adminId: admins[0]?.id ?? "",
      branchId: branches[0]?.id ?? ""
    });
    setNotice("");
    setIsDrawerOpen(false);
  }

  function handleAddUserClick() {
    cancelEdit();
    setIsDrawerOpen(true);
  }

  async function handleDeleteUser(targetUser) {
    setNotice("");
    if (!window.confirm(`Are you sure you want to delete ${targetUser.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest(`/auth/users/${targetUser.id}`, { method: "DELETE" });
      setNotice(`${targetUser.name} was deleted.`);
      await loadUsers(userMgmtCompanyFilter || selectedAccountId);
      await loadAccounts();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleOpenUserDetail(targetUser) {
    if (user.role !== "DEVELOPER" && user.role !== "SUPER_ADMIN") return;
    setUserDetailLoading(true);
    setSelectedUserDetail({ user: targetUser, activityLogs: [] });
    try {
      const data = await apiRequest(`/auth/users/${targetUser.id}/details`);
      setSelectedUserDetail(data);
    } catch (err) {
      setNotice(err.message);
      setSelectedUserDetail(null);
    } finally {
      setUserDetailLoading(false);
    }
  }

  async function handleVerifyUser(targetUser) {
    if (!window.confirm(`Verify ${targetUser.name} without an OTP?`)) {
      return;
    }

    setNotice("");
    try {
      const data = await apiRequest(`/auth/users/${targetUser.id}/verify-email`, { method: "POST" });
      setNotice(data.message);
      await loadUsers(userMgmtCompanyFilter || selectedAccountId);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleUnverifyUser(targetUser) {
    if (!window.confirm(`Mark ${targetUser.name} as unverified? They will need OTP verification before their next login.`)) {
      return;
    }

    setNotice("");
    try {
      const data = await apiRequest(`/auth/users/${targetUser.id}/unverify-email`, { method: "POST" });
      setNotice(data.message);
      await loadUsers(userMgmtCompanyFilter || selectedAccountId);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleSendVerification(targetUser) {
    setNotice("");
    try {
      const data = await apiRequest(`/auth/users/${targetUser.id}/send-verification`, { method: "POST" });
      setNotice(data.message);
      await loadUsers(userMgmtCompanyFilter || selectedAccountId);
    } catch (err) {
      setNotice(err.message);
    }
  }

  function verificationStatusTitle(targetUser) {
    if (!targetUser.emailVerified) return "Email verification pending";
    if (targetUser.emailVerificationMethod === "developer") {
      return `Verified by Developer: ${targetUser.emailVerifiedBy?.name || "Developer"}`;
    }
    if (targetUser.emailVerificationMethod === "otp") return "Verified by email OTP";
    return "Verified by system or existing account migration";
  }

  const totals = useMemo(() => {
    const healthy = records.filter((record) => record.status === "healthy").length;
    const accountsVisible = canManageAccounts ? accounts.length : user.accountId ? 1 : 0;
    const kpis = otterlyData?.dashboard?.kpis;

    return {
      records: otterlyData?.resources?.length ?? records.length,
      healthy: kpis?.geoScore ?? healthy,
      accounts: accountsVisible,
      users: managedUsers.length
    };
  }, [records, accounts, canManageAccounts, user.accountId, managedUsers, otterlyData]);

  const groupedUsers = useMemo(() => {
    const rolePriority = {
      SUPER_ADMIN: 1,
      BUSINESS_OWNER: 2,
      MARKETING_MANAGER: 3,
      OPERATIONS_MANAGER: 4,
      BRANCH_MANAGER: 5,
      TECHNICIAN: 6,
      ANALYST: 7
    };
    
    return [...managedUsers].sort((a, b) => {
      const priorityA = rolePriority[a.role] || 99;
      const priorityB = rolePriority[b.role] || 99;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [managedUsers]);

  const filteredUsers = useMemo(() => {
    return groupedUsers.filter((u) => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = filterRole ? u.role === filterRole : true;
      const matchCompany = user.role !== "DEVELOPER" ||
        userMgmtCompanyFilter === "all" ||
        (u.accountId || "global") === userMgmtCompanyFilter;

      return matchSearch && matchRole && matchCompany;
    });
  }, [groupedUsers, searchTerm, filterRole, user.role, userMgmtCompanyFilter]);

  const groupedByCompany = useMemo(() => {
    const groups = {};
    filteredUsers.forEach(u => {
      const compId = u.accountId || "global";
      const compName = u.account?.name || "Global / System Platform";
      if (!groups[compId]) {
        groups[compId] = { id: compId, name: compName, users: [] };
      }
      groups[compId].users.push(u);
    });
    return Object.values(groups);
  }, [filteredUsers]);

  // Helper to build tree from flat user list
  function buildUserTree(usersList) {
    const userMap = {};
    const roots = [];
    const fallbackParentRoles = {
      BUSINESS_OWNER: ["SUPER_ADMIN"],
      MARKETING_MANAGER: ["BUSINESS_OWNER", "SUPER_ADMIN"],
      OPERATIONS_MANAGER: ["BUSINESS_OWNER", "SUPER_ADMIN"],
      BRANCH_MANAGER: ["BUSINESS_OWNER", "SUPER_ADMIN"],
      TECHNICIAN: ["BRANCH_MANAGER", "BUSINESS_OWNER", "SUPER_ADMIN"],
      ANALYST: ["BUSINESS_OWNER", "SUPER_ADMIN"]
    };
    
    // Initialize map
    usersList.forEach(u => {
      userMap[u.id] = { ...u, children: [] };
    });
    
    // Link children to parents
    usersList.forEach(u => {
      const mapped = userMap[u.id];
      const explicitParent = u.adminId && userMap[u.adminId] ? userMap[u.adminId] : null;
      const fallbackParent = !explicitParent
        ? (fallbackParentRoles[u.role] || [])
            .map((role) => usersList.find((candidate) => candidate.role === role && candidate.id !== u.id))
            .find(Boolean)
        : null;
      const parent = explicitParent || (fallbackParent ? userMap[fallbackParent.id] : null);

      if (parent) {
        parent.children.push(mapped);
      } else {
        roots.push(mapped);
      }
    });
    
    return roots;
  }

  function renderTreeNode(node, depth = 0) {
    return (
      <div key={node.id} className={`tree-node-wrapper ${depth > 0 ? "is-child" : "is-root"}`}>
        <div className={`tree-user-card ${user.role === "DEVELOPER" || user.role === "SUPER_ADMIN" ? "clickable-user-row" : ""}`} onClick={() => handleOpenUserDetail(node)} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '8px',
          padding: '10px 16px',
          minWidth: '280px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}&background=f0f4f8&color=1a2533&rounded=true&bold=true`} 
              alt={node.name} 
              style={{ width: '32px', height: '32px', borderRadius: '50%' }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{node.name}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{node.email}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`status role-${node.role.toLowerCase()}`} style={{ margin: 0, padding: '3px 8px', fontSize: '10px' }}>
              {roleLabels[node.role]}
            </span>
            <span className={`verification-status ${node.emailVerified ? "verified" : "pending"}`} title={verificationStatusTitle(node)}>
              {node.emailVerified ? "Verified" : "Pending"}
            </span>
            {node.branch?.name && (
              <span style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#5c6cf2' }}>
                {node.branch.name}
              </span>
            )}
            
            {ROLE_LEVELS[node.role] < (ROLE_LEVELS[user.role] || 0) || (user.role === "DEVELOPER" && node.id !== user.id) ? (
              <div className="action-buttons" onClick={(event) => event.stopPropagation()} style={{ display: 'flex', gap: '4px' }}>
                {user.role === "DEVELOPER" && !node.emailVerified ? (
                  <>
                    <button className="icon-button" onClick={() => handleSendVerification(node)} title={`Send OTP to ${node.name}`}>
                      <Send size={14} />
                    </button>
                    <button className="icon-button success" onClick={() => handleVerifyUser(node)} title={`Verify ${node.name} without OTP`}>
                      <CheckCircle size={14} />
                    </button>
                  </>
                ) : null}
                {user.role === "DEVELOPER" && node.emailVerified && node.id !== user.id ? (
                  <button className="icon-button warning" onClick={() => handleUnverifyUser(node)} title={`Mark ${node.name} as unverified`}>
                    <AlertCircle size={14} />
                  </button>
                ) : null}
                {ROLE_LEVELS[node.role] < (ROLE_LEVELS[user.role] || 0) ? (
                  <>
                    <button className="icon-button" onClick={() => handleEditUser(node)} title={`Edit ${node.name}`}>
                      <Pencil size={14} />
                    </button>
                    {node.id !== user.id ? (
                      <button className="icon-button danger" onClick={() => handleDeleteUser(node)} title={`Delete ${node.name}`}>
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: '#64748b' }}>Locked</span>
            )}
          </div>
        </div>
        
        {node.children && node.children.length > 0 && (
          <div className="tree-node-children">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId);
  const dashboardNavLabel = otterlyData?.dashboard?.brand || selectedAccount?.name || user.account?.name || "Dashboard";
  const pageTitle = {
    dashboard: user.role === "DEVELOPER" ? dashboardNavLabel : user.account?.name ?? "Assigned Account",
    settings: "Settings"
  }[activeView] || dashboardNavLabel;
  const visibleOtterlyTabs = user.role === "DEVELOPER"
    ? otterlyDashboardTabs
    : otterlyDashboardTabs.filter(([key]) => key !== "account");
  const visibleOtterlyTab = visibleOtterlyTabs.some(([key]) => key === otterlyTab) ? otterlyTab : "overview";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img src="/Nexora AI. 2.png" alt="Nexora AI" className="sidebar-logo" />
          </div>
          <nav className="sidebar-nav-list">
            <button 
              className={`sidebar-nav-btn ${activeView === "dashboard" ? "active" : ""}`} 
              onClick={() => {
                setActiveView("dashboard");
                setOtterlyTab("overview");
              }}
            >
              <BarChart3 size={18} />
              <span>{dashboardNavLabel}</span>
            </button>
            {activeView === "dashboard" ? (
              <div className="sidebar-subnav">
                {visibleOtterlyTabs.map(([key, label, Icon]) => (
                  <button
                    key={key}
                    className={`sidebar-subnav-btn ${visibleOtterlyTab === key ? "active" : ""}`}
                    onClick={() => {
                      setActiveView("dashboard");
                      setOtterlyTab(key);
                    }}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <button 
              className={`sidebar-nav-btn ${activeView === "settings" ? "active" : ""}`} 
              onClick={() => setActiveView("settings")}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-profile-user">
            <div className="profile-avatar">
              {user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "US"}
            </div>
            <div className="profile-info">
              <span className="profile-name" title={user.name}>{user.name}</span>
              <span className={`status role-${user.role.toLowerCase()} profile-role`}>
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
          <button onClick={onLogout} className="sidebar-logout-btn" title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            {activeView === "settings" && settingsTab === "users" ? (
              <p>{roleLabels[user.role]} Access</p>
            ) : null}
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-actions" />
        </header>

        {activeView === "dashboard" ? (
          <OtterlyDashboardPanel
            data={otterlyData}
            loading={loading}
            canSync={canSync}
            onSync={handleSync}
            onReload={() => loadDashboard(selectedAccountId)}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={(id) => {
              setSelectedAccountId(id);
              loadDashboard(id);
              loadUsers(id);
              loadAdmins(id);
              loadBranches(id);
            }}
            user={user}
            activeTab={visibleOtterlyTab}
          />
        ) : null}

        {notice ? <p className="notice">{notice}</p> : null}

        {activeView === "settings" ? (
          <section key="settings-view" className="data-section tab-transition">
            <div className="settings-nav" style={{ marginTop: '8px' }}>
              {canManageUsers ? (
                <button className={settingsTab === "users" ? "active" : ""} onClick={() => setSettingsTab("users")}>
                  <Users size={16} /> User management
                </button>
              ) : null}
              <button className={settingsTab === "personal" ? "active" : ""} onClick={() => setSettingsTab("personal")}>
                <User size={16} /> Personal info
              </button>
              <button className={settingsTab === "integrations" ? "active" : ""} onClick={() => setSettingsTab("integrations")}>
                <Link size={16} /> Integrations
              </button>
            </div>

            {settingsTab === "users" && canManageUsers ? (
              <div key="users-tab" className="premium-users-view tab-transition">
                {/* Premium Developer User Management Stats Card Row */}
                {user.role === "DEVELOPER" && (
                  <div className="role-grid" style={{ marginBottom: '20px' }}>
                    <div className="role-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
                      <div className="role-card-header">
                        <Building size={16} style={{ color: '#5c6cf2' }} />
                        <h4 style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Total Workspaces</h4>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{accounts.length}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>Registered companies</span>
                      </div>
                    </div>

                    <div className="role-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
                      <div className="role-card-header">
                        <Users size={16} style={{ color: '#5c6cf2' }} />
                        <h4 style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Active Users</h4>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{managedUsers.length}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>Total across accounts</span>
                      </div>
                    </div>

                    <div className="role-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
                      <div className="role-card-header">
                        <Briefcase size={16} style={{ color: '#5c6cf2' }} />
                        <h4 style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Business Owners</h4>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{managedUsers.filter(u => u.role === 'BUSINESS_OWNER').length}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>Admins & operators</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search, Filter and Actions Header */}
                <div className="users-filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="search-filter-inputs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="premium-search-input"
                        style={{ minWidth: '220px' }}
                      />
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="premium-filter-select"
                      >
                        <option value="">All Roles</option>
                        {Object.keys(ROLE_LEVELS).map((roleKey) => (
                          <option key={roleKey} value={roleKey}>
                            {roleLabels[roleKey]}
                          </option>
                        ))}
                      </select>

                      {user.role === "DEVELOPER" && (
                        <select
                          value={userMgmtCompanyFilter}
                          onChange={(e) => {
                            const newFilter = e.target.value;
                            setUserMgmtCompanyFilter(newFilter);
                            loadAdmins(newFilter !== 'all' ? newFilter : selectedAccountId);
                            loadBranches(newFilter !== 'all' ? newFilter : selectedAccountId || user.accountId);
                          }}
                          className="premium-filter-select"
                        >
                          <option value="all">All Companies</option>
                          <option value="global">Global / System Platform</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* View Mode Toggle */}
                      <div className="view-mode-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px' }}>
                        <button 
                          type="button" 
                          className={`toggle-btn ${userMgmtViewMode === 'tree' ? 'active' : ''}`} 
                          onClick={() => setUserMgmtViewMode('tree')}
                          style={{ border: 'none', padding: '6px 12px', fontSize: '12px', background: userMgmtViewMode === 'tree' ? '#aeb6fb' : 'transparent', color: userMgmtViewMode === 'tree' ? '#090d16' : '#94a3b8', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Tree View
                        </button>
                        <button 
                          type="button" 
                          className={`toggle-btn ${userMgmtViewMode === 'list' ? 'active' : ''}`} 
                          onClick={() => setUserMgmtViewMode('list')}
                          style={{ border: 'none', padding: '6px 12px', fontSize: '12px', background: userMgmtViewMode === 'list' ? '#aeb6fb' : 'transparent', color: userMgmtViewMode === 'list' ? '#090d16' : '#94a3b8', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Table List
                        </button>
                      </div>

                      <button onClick={handleAddUserClick} className="btn-add-user secondary-button" style={{ height: '38px', padding: '0 16px' }}>
                        <UserPlus size={16} /> Add User
                      </button>
                    </div>
                  </div>
                </div>

                {userMgmtViewMode === "tree" ? (
                  /* Visual Grouped Tree Hierarchy Mode */
                  <div className="visual-tree-view-container" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {groupedByCompany.map((group) => {
                      const treeRoots = buildUserTree(group.users);
                      const isGlobalGroup = group.id === "global";
                      return (
                        <div 
                          key={group.id} 
                          className="tenants-list-card" 
                          style={{ 
                            background: isGlobalGroup ? 'linear-gradient(135deg, rgba(174, 182, 251, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%)' : 'rgba(255, 255, 255, 0.02)', 
                            border: isGlobalGroup ? '1px solid rgba(174, 182, 251, 0.35)' : '1px solid var(--border-color)', 
                            borderRadius: '12px', 
                            padding: '20px',
                            boxShadow: isGlobalGroup ? '0 0 15px rgba(174, 182, 251, 0.08)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {isGlobalGroup ? (
                                <Cpu size={18} style={{ color: '#5c6cf2' }} />
                              ) : (
                                <Building size={18} style={{ color: '#5c6cf2' }} />
                              )}
                              <div>
                                <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>
                                  {isGlobalGroup ? "Global System Administrators" : group.name}
                                </h4>
                                {isGlobalGroup && (
                                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                                    Root system developer accounts that operate globally and do not belong to any specific company workspace.
                                  </span>
                                )}
                              </div>
                            </div>
                            {user.role === "DEVELOPER" && group.id !== "global" && group.id !== user.accountId && (
                              <button 
                                className="btn-delete-company" 
                                onClick={() => handleDeleteCompany(group.id, group.name)}
                                title={`Delete Company: ${group.name}`}
                              >
                                <Trash2 size={13} /> Delete Company
                              </button>
                            )}
                          </div>

                          <div className="visual-company-tree" style={{ paddingLeft: '8px' }}>
                            {treeRoots.length ? (
                              treeRoots.map(rootNode => renderTreeNode(rootNode, 0))
                            ) : (
                              <p className="muted-text" style={{ fontSize: '12px', fontStyle: 'italic', margin: 0 }}>No users found for this company.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {!groupedByCompany.length && (
                      <div className="tenants-list-card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        No users or company listings found.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard List Table Mode */
                  <div className="table-wrap users-table full-width-table" style={{ marginTop: '20px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Account</th>
                          <th>Branch</th>
                          <th>Admin</th>
                          <th>Verification</th>
                          <th className="align-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((managedUser) => (
                          <tr
                            key={managedUser.id}
                            className={`user-row ${user.role === "DEVELOPER" || user.role === "SUPER_ADMIN" ? "clickable-user-row" : ""}`}
                            onClick={() => handleOpenUserDetail(managedUser)}
                          >
                            <td>
                              <div className="user-profile">
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(managedUser.name)}&background=f0f4f8&color=1a2533&rounded=true&bold=true`} alt={managedUser.name} className="user-avatar" />
                                <div className="user-info">
                                  <span className="user-name">{managedUser.name}</span>
                                  <span className="user-email">{managedUser.email}</span>
                                </div>
                              </div>
                            </td>
                            <td><span className={`status role-${managedUser.role.toLowerCase()}`}>{roleLabels[managedUser.role]}</span></td>
                            <td>
                              <div className="account-cell">
                                {managedUser.account?.name ? (
                                  <><Database size={14} className="cell-icon"/> {managedUser.account.name}</>
                                ) : (
                                  <><Settings size={14} className="cell-icon"/> Global</>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="branch-name-cell font-medium">{managedUser.branch?.name ?? "Global"}</span>
                            </td>
                            <td>
                              <span className="admin-name">{managedUser.admin?.name ?? (managedUser.role === "BUSINESS_OWNER" || managedUser.role === "SUPER_ADMIN" || managedUser.role === "DEVELOPER" ? "Self managed" : "Unassigned")}</span>
                            </td>
                            <td>
                              <span className={`verification-status ${managedUser.emailVerified ? "verified" : "pending"}`} title={verificationStatusTitle(managedUser)}>
                                {managedUser.emailVerified ? "Verified" : "Pending"}
                              </span>
                            </td>
                             <td className="align-right">
                              {ROLE_LEVELS[managedUser.role] < (ROLE_LEVELS[user.role] || 0) || (user.role === "DEVELOPER" && managedUser.id !== user.id) ? (
                                <div className="action-buttons" onClick={(event) => event.stopPropagation()}>
                                  {user.role === "DEVELOPER" && !managedUser.emailVerified ? (
                                    <>
                                      <button className="icon-button" onClick={() => handleSendVerification(managedUser)} title={`Send OTP to ${managedUser.name}`}>
                                        <Send size={16} />
                                      </button>
                                      <button className="icon-button success" onClick={() => handleVerifyUser(managedUser)} title={`Verify ${managedUser.name} without OTP`}>
                                        <CheckCircle size={16} />
                                      </button>
                                    </>
                                  ) : null}
                                  {user.role === "DEVELOPER" && managedUser.emailVerified && managedUser.id !== user.id ? (
                                    <button className="icon-button warning" onClick={() => handleUnverifyUser(managedUser)} title={`Mark ${managedUser.name} as unverified`}>
                                      <AlertCircle size={16} />
                                    </button>
                                  ) : null}
                                  {ROLE_LEVELS[managedUser.role] < (ROLE_LEVELS[user.role] || 0) ? (
                                    <>
                                      <button className="icon-button" onClick={() => handleEditUser(managedUser)} title={`Edit ${managedUser.name}`}>
                                        <Pencil size={16} />
                                      </button>
                                      {managedUser.id !== user.id ? (
                                        <button className="icon-button danger" onClick={() => handleDeleteUser(managedUser)} title={`Delete ${managedUser.name}`}>
                                          <Trash2 size={16} />
                                        </button>
                                      ) : null}
                                    </>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="muted-text">Locked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {!filteredUsers.length && !usersLoading ? (
                          <tr>
                            <td colSpan="7" className="empty-state">
                              <div className="empty-state-content">
                                <Users size={32} className="empty-icon" />
                                <p>No users found matching filters.</p>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                )}

                <div
                  className={`user-detail-overlay ${selectedUserDetail ? "open" : ""}`}
                  onClick={() => setSelectedUserDetail(null)}
                >
                  <aside className="user-detail-drawer" onClick={(event) => event.stopPropagation()}>
                    <div className="drawer-header">
                      <h3>User Details</h3>
                      <button type="button" className="drawer-close" onClick={() => setSelectedUserDetail(null)} title="Close user details">
                        <X size={20} />
                      </button>
                    </div>

                    {selectedUserDetail ? (
                      <div className="user-detail-content">
                        <div className="user-detail-profile">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUserDetail.user.name)}&background=f0f4f8&color=1a2533&rounded=true&bold=true`}
                            alt={selectedUserDetail.user.name}
                            className="user-detail-avatar"
                          />
                          <div>
                            <h4>{selectedUserDetail.user.name}</h4>
                            <p>{selectedUserDetail.user.email}</p>
                          </div>
                        </div>

                        <div className="user-detail-grid">
                          <div><span>Role</span><strong>{roleLabels[selectedUserDetail.user.role]}</strong></div>
                          <div><span>Company</span><strong>{selectedUserDetail.user.account?.name || "Global / System"}</strong></div>
                          <div><span>Branch</span><strong>{selectedUserDetail.user.branch?.name || "Not assigned"}</strong></div>
                          <div><span>Manager</span><strong>{selectedUserDetail.user.admin?.name || "Self managed"}</strong></div>
                          <div><span>Verification</span><strong title={verificationStatusTitle(selectedUserDetail.user)}>{selectedUserDetail.user.emailVerified ? "Verified" : "Pending"}</strong></div>
                          <div><span>Created</span><strong>{new Date(selectedUserDetail.user.createdAt).toLocaleString()}</strong></div>
                        </div>

                        <section className="activity-log-section">
                          <div className="activity-log-header">
                            <Activity size={16} />
                            <h4>Activity Log</h4>
                          </div>
                          {userDetailLoading ? <p className="muted-text">Loading activity...</p> : null}
                          {!userDetailLoading && selectedUserDetail.activityLogs.length ? (
                            <div className="activity-log-list">
                              {selectedUserDetail.activityLogs.map((log) => (
                                <div key={log.id} className="activity-log-item">
                                  <span className={`activity-dot ${log.statusCode >= 400 ? "error" : ""}`} />
                                  <div>
                                    <strong>{log.action.replaceAll("_", " ")}</strong>
                                    <p>{new Date(log.createdAt).toLocaleString()}</p>
                                  </div>
                                  {log.statusCode ? <code>{log.statusCode}</code> : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {!userDetailLoading && !selectedUserDetail.activityLogs.length ? (
                            <p className="muted-text">No activity has been recorded for this user yet.</p>
                          ) : null}
                        </section>
                      </div>
                    ) : null}
                  </aside>
                </div>

                {/* Glassmorphic Slide-Out Form Drawer */}
                <div className={`drawer-overlay ${isDrawerOpen ? "open" : ""}`} onClick={cancelEdit}>
                  <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                      <h3>{editingUserId ? "Edit User Account" : "Add New User Account"}</h3>
                      <button type="button" className="drawer-close" onClick={cancelEdit}>
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form className="drawer-form" onSubmit={handleSaveUser}>
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
                        <span>Password {editingUserId ? <span className="muted-text" style={{fontWeight: 400}}>(leave blank to keep current)</span> : ""}</span>
                        <span className="password-input">
                          <input
                            value={userForm.password}
                            onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                            minLength="8"
                            placeholder={editingUserId ? "Leave blank to keep unchanged" : "Minimum 8 characters"}
                            type={showUserPassword ? "text" : "password"}
                            required={!editingUserId}
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowUserPassword((visible) => !visible)}
                            aria-label={showUserPassword ? "Hide password" : "Show password"}
                            title={showUserPassword ? "Hide password" : "Show password"}
                          >
                            {showUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </span>
                      </label>
                      
                      {/* Company Selection Dropdown for Developer & Super Admin */}
                      {user.role === "DEVELOPER" ? (
                        userForm.role === "SUPER_ADMIN" ? (
                          <label>
                            Company Name (Creates new company) *
                            <input
                              value={userForm.companyName}
                              onChange={(event) => setUserForm((current) => ({ ...current, companyName: event.target.value }))}
                              placeholder="e.g. Acme Corporation"
                              required
                            />
                          </label>
                        ) : (
                          <label>
                            Belongs to Company *
                            <select
                              value={userForm.accountId}
                              onChange={(event) => {
                                const newAccId = event.target.value;
                                setUserForm((current) => ({ 
                                  ...current, 
                                  accountId: newAccId,
                                  adminId: "",
                                  branchId: ""
                                }));
                                loadAdmins(newAccId);
                                loadBranches(newAccId);
                              }}
                              required
                            >
                              <option value="">Select Company</option>
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                              ))}
                            </select>
                          </label>
                        )
                      ) : null}

                      {/* Select Role */}
                      <label>
                        Role
                        <select
                          value={userForm.role}
                          onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value, adminId: "", branchId: "" }))}
                        >
                          {Object.keys(ROLE_LEVELS)
                            .filter((r) => ROLE_LEVELS[r] < (ROLE_LEVELS[user.role] || 0))
                            .map((roleKey) => (
                              <option key={roleKey} value={roleKey}>
                                {roleLabels[roleKey]}
                              </option>
                            ))}
                        </select>
                      </label>

                      {/* Branch Selection Dropdown */}
                      {(userForm.role === "BRANCH_MANAGER" || userForm.role === "TECHNICIAN") ? (
                        <label>
                          Branch (Location)
                          <select
                            value={userForm.branchId}
                            onChange={(event) => setUserForm((current) => ({ ...current, branchId: event.target.value }))}
                          >
                            <option value="">None / Select branch (Optional)</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {/* Manager Selection Dropdown */}
                      {(userForm.role !== "SUPER_ADMIN" && userForm.role !== "DEVELOPER" && userForm.role !== "BUSINESS_OWNER") ? (
                        <label>
                          Reporting Manager / Admin
                          <select
                            value={userForm.adminId}
                            onChange={(event) => setUserForm((current) => ({ ...current, adminId: event.target.value }))}
                          >
                            <option value="">None / Select manager (Optional)</option>
                            {admins
                              .filter((admin) => !userForm.accountId || admin.accountId === userForm.accountId)
                              .map((admin) => (
                                <option key={admin.id} value={admin.id}>{admin.name} ({roleLabels[admin.role]})</option>
                              ))}
                          </select>
                        </label>
                      ) : null}

                      <button type="submit" className="secondary-button drawer-submit-btn">
                        {editingUserId ? <Pencil size={16} /> : <UserPlus size={16} />}
                        {editingUserId ? "Save Changes" : "Create User Account"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : null}

            {settingsTab === "personal" ? (
              <form onSubmit={handleUpdateSelf} className="settings-container tab-transition">
                {/* Profile Section */}
                <div className="settings-group">
                  <div className="settings-header-col">
                    <h3>Profile Details</h3>
                    <p>Update your personal account information, name, and system credentials.</p>
                  </div>
                  <div className="settings-card">
                    <div className="settings-card-fields">
                      <div className="settings-field">
                        <span className="settings-field-span">Full Name <span className="settings-field-required">*</span></span>
                        <input 
                          value={selfName} 
                          onChange={e => setSelfName(e.target.value)} 
                          placeholder="Your Name" 
                          required 
                        />
                      </div>
                      
                      <div className="settings-field">
                        <span className="settings-field-span">Password</span>
                        <input 
                          type="password" 
                          value={selfPassword} 
                          onChange={e => setSelfPassword(e.target.value)} 
                          placeholder="Leave blank to keep unchanged" 
                          minLength="8"
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Email Address (Read-only)</span>
                        <input 
                          value={user.email} 
                          disabled 
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">System Role</span>
                        <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                          <span className={`status role-${user.role.toLowerCase()}`} style={{ margin: 0, padding: '6px 12px', fontSize: '12px' }}>
                            {roleLabels[user.role]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Section */}
                <div className="settings-group">
                  <div className="settings-header-col">
                    <h3>Company Profile</h3>
                    <p>Your organization's identity, metadata, and billing address. Fields marked with * are required.</p>
                    {!canManageCompany && (
                      <div className="settings-read-only-badge" style={{ marginTop: '16px' }}>
                        <Shield size={14} /> Read-Only Mode
                      </div>
                    )}
                  </div>
                  <div className="settings-card">
                    <div className="settings-card-fields">
                      <div className="settings-field">
                        <span className="settings-field-span">Company Name <span className="settings-field-required">*</span></span>
                        <input 
                          value={companyName} 
                          onChange={e => setCompanyName(e.target.value)} 
                          placeholder="Company Name" 
                          required 
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>
                      
                      <div className="settings-field">
                        <span className="settings-field-span">Company Slug <span className="settings-field-required">*</span></span>
                        <input 
                          value={companySlug} 
                          onChange={e => setCompanySlug(e.target.value)} 
                          placeholder="company-slug" 
                          pattern="^[a-z0-9-]+$"
                          title="Lowercase letters, digits, and hyphens only"
                          required 
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Tagline</span>
                        <input 
                          value={companyTagline} 
                          onChange={e => setCompanyTagline(e.target.value)} 
                          placeholder="Tagline" 
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Billing Address Line 1 <span className="settings-field-required">*</span></span>
                        <input 
                          value={billingAddressLine1} 
                          onChange={e => setBillingAddressLine1(e.target.value)} 
                          placeholder="Billing Address Line 1" 
                          required
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Billing Address Line 2</span>
                        <input 
                          value={billingAddressLine2} 
                          onChange={e => setBillingAddressLine2(e.target.value)} 
                          placeholder="Billing Address Line 2" 
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">City <span className="settings-field-required">*</span></span>
                        <input 
                          value={city} 
                          onChange={e => setCity(e.target.value)} 
                          placeholder="City" 
                          required
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">State <span className="settings-field-required">*</span></span>
                        <select 
                          value={state} 
                          onChange={e => setState(e.target.value)}
                          required
                          disabled={!canManageCompany || !user.accountId}
                        >
                          <option value="">Select State/Province</option>
                          <option value="Ontario">Ontario</option>
                          <option value="Quebec">Quebec</option>
                          <option value="British Columbia">British Columbia</option>
                          <option value="Alberta">Alberta</option>
                          <option value="New York">New York</option>
                          <option value="California">California</option>
                          <option value="Florida">Florida</option>
                          <option value="Texas">Texas</option>
                        </select>
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Country <span className="settings-field-required">*</span></span>
                        <select 
                          value={country} 
                          onChange={e => setCountry(e.target.value)}
                          required
                          disabled={!canManageCompany || !user.accountId}
                        >
                          <option value="">Select Country</option>
                          <option value="Canada">Canada</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Zipcode / Postal Code <span className="settings-field-required">*</span></span>
                        <input 
                          value={zipcode} 
                          onChange={e => setZipcode(e.target.value)} 
                          placeholder="Zipcode / Postal Code" 
                          required
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Administrator Name <span className="settings-field-required">*</span></span>
                        <input 
                          value={administrator} 
                          onChange={e => setAdministrator(e.target.value)} 
                          placeholder="Administrator Name" 
                          required
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Cellphone</span>
                        <input 
                          value={cellphone} 
                          onChange={e => setCellphone(e.target.value)} 
                          placeholder="Cellphone (e.g. (519) 216-8200)" 
                          disabled={!canManageCompany || !user.accountId}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="settings-group">
                  <div className="settings-header-col">
                    <h3>App Preferences</h3>
                    <p>Configure localization settings, language, currency, and timezone rules.</p>
                  </div>
                  <div className="settings-card">
                    <div className="settings-card-fields">
                      <div className="settings-field">
                        <span className="settings-field-span">Default Timezone</span>
                        <select 
                          value={timezone} 
                          onChange={e => setTimezone(e.target.value)}
                          disabled={!canManageCompany || !user.accountId}
                        >
                          <option value="America/Toronto">(GMT-05:00) Eastern Time - (America/Toronto)</option>
                          <option value="America/New_York">(GMT-05:00) Eastern Time - (America/New_York)</option>
                          <option value="America/Chicago">(GMT-06:00) Central Time - (America/Chicago)</option>
                          <option value="America/Denver">(GMT-07:00) Mountain Time - (America/Denver)</option>
                          <option value="America/Los_Angeles">(GMT-08:00) Pacific Time - (America/Los_Angeles)</option>
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                        </select>
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Default Locale</span>
                        <select 
                          value={locale} 
                          onChange={e => setLocale(e.target.value)}
                          disabled={!canManageCompany || !user.accountId}
                        >
                          <option value="en-CA">English (Canada)</option>
                          <option value="en-US">English (United States)</option>
                          <option value="en-GB">English (United Kingdom)</option>
                          <option value="fr-CA">French (Canada)</option>
                        </select>
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Default Language</span>
                        <select 
                          value={language} 
                          onChange={e => setLanguage(e.target.value)}
                          disabled={!canManageCompany || !user.accountId}
                        >
                          <option value="English">English</option>
                          <option value="French">French</option>
                          <option value="Spanish">Spanish</option>
                        </select>
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-span">Default Currency</span>
                        <select 
                          value={currency} 
                          onChange={e => setCurrency(e.target.value)}
                          disabled={!canManageCompany || !user.accountId}
                        >
                          <option value="CAD">Canadian Dollar (CAD)</option>
                          <option value="USD">US Dollar (USD)</option>
                          <option value="GBP">British Pound (GBP)</option>
                          <option value="EUR">Euro (EUR)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-submit-row">
                  <button type="submit" disabled={selfSaving} className="btn-add-user secondary-button" style={{ height: '44px', padding: '0 32px' }}>
                    {selfSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            ) : null}

            {settingsTab === "integrations" ? (
              <div key="integrations-tab" className="tab-transition">
                {user.role === "DEVELOPER" ? (
                  <div className="table-wrap users-table full-width-table" style={{ marginBottom: '20px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Connected Platforms</th>
                          <th>Connection Summary</th>
                          <th>Last Connection</th>
                        </tr>
                      </thead>
                      <tbody>
                        {integrationOverview.map(({ account, integrations }) => {
                          const connected = integrations.filter((item) => item.status === "connected");
                          const latestConnection = connected
                            .map((item) => item.connectedAt)
                            .filter(Boolean)
                            .sort()
                            .at(-1);
                          return (
                            <tr key={account.id} className="user-row">
                              <td>
                                <div className="account-cell">
                                  <Building size={14} className="cell-icon" />
                                  <strong>{account.name}</strong>
                                </div>
                              </td>
                              <td>
                                <div className="integration-platform-list">
                                  {connected.length ? connected.map((item) => (
                                    <span key={item.platformKey} className="integration-platform-chip">
                                      {item.platformName}
                                    </span>
                                  )) : <span className="muted-text">No platforms connected</span>}
                                </div>
                              </td>
                              <td>
                                <span className={`integration-status-badge ${connected.length ? "connected" : "disconnected"}`}>
                                  {connected.length} of {integrations.length} connected
                                </span>
                              </td>
                              <td className="muted-text">
                                {latestConnection ? new Date(latestConnection).toLocaleString() : "Never"}
                              </td>
                            </tr>
                          );
                        })}
                        {!integrationOverview.length ? (
                          <tr>
                            <td colSpan="4" className="empty-state">No companies available.</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="users-filter-bar" style={{ marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Company Integration Control</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                      Connect one or more platforms for the selected company. New companies start with all platforms available and disconnected.
                    </p>
                  </div>
                  {user.role === "DEVELOPER" ? (
                    <select
                      value={activeIntegrationAccountId || ""}
                      onChange={(event) => {
                        setSelectedAccountId(event.target.value);
                        loadIntegrations(event.target.value);
                      }}
                      className="premium-filter-select"
                    >
                      <option value="">Select Company</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                      ))}
                    </select>
                  ) : null}
                </div>

                <div className="table-wrap users-table full-width-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Sync</th>
                        <th>Last Connected</th>
                        <th className="align-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleIntegrationPlatforms.map((platform) => {
                        const row = connectedIntegrations.find((item) => item.platformKey === platform.key);
                        const isConnected = row?.status === "connected";
                        return (
                          <tr key={platform.key} className="user-row">
                            <td>
                              <div className="user-profile">
                                <div className={`integration-icon-container ${platform.iconClass}`} style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                  {platform.initials}
                                </div>
                                <div className="user-info">
                                  <span className="user-name">{platform.name}</span>
                                  <span className="user-email">{platform.key}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ maxWidth: '360px', color: '#64748b', fontSize: '13px' }}>{platform.description}</td>
                            <td>
                              <span className={`integration-status-badge ${isConnected ? "connected" : "disconnected"}`}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#5c6cf2' : '#94a3b8', display: 'inline-block' }} />
                                {isConnected ? "Connected" : "Disconnected"}
                              </span>
                            </td>
                            <td>{row?.config?.syncInterval ?? "Not configured"}</td>
                            <td className="muted-text">{row?.connectedAt ? new Date(row.connectedAt).toLocaleString() : "Never"}</td>
                            <td className="align-right">
                              {isConnected ? (
                                <button
                                  type="button"
                                  onClick={() => handleDisconnectIntegration(platform.key, platform.name)}
                                  className="secondary-button"
                                  style={{ height: '34px', padding: '0 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', boxShadow: 'none' }}
                                >
                                  Disconnect
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIntegrationForm({
                                      apiKey: row?.config?.apiKey || "",
                                      workspaceId: row?.config?.workspaceId || "",
                                      brandReportId: row?.config?.brandReportId || "",
                                      brand: row?.config?.brand || "",
                                      brandDomain: row?.config?.brandDomain || "",
                                      defaultCountry: row?.config?.defaultCountry || "us",
                                      clientId: row?.config?.clientId || "",
                                      clientSecret: row?.config?.clientSecret || "",
                                      syncInterval: row?.config?.syncInterval || "1h",
                                      sandbox: row?.config?.sandbox ?? true
                                    });
                                    setActiveConnectingPlatform(platform);
                                  }}
                                  className="btn-add-user secondary-button"
                                  style={{ height: '34px', padding: '0 14px' }}
                                  disabled={!activeIntegrationAccountId}
                                >
                                  Connect
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

      </section>

      {activeConnectingPlatform ? (
        <div className="modal-overlay">
          <form onSubmit={handleConnectIntegration} className="modal-card tab-transition">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`integration-icon-container ${activeConnectingPlatform.iconClass}`} style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                  {activeConnectingPlatform.initials}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Connect {activeConnectingPlatform.name}</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Configure enterprise credentials</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveConnectingPlatform(null)} 
                style={{ background: 'transparent', padding: '6px', borderRadius: '50%', color: '#94a3b8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {activeConnectingPlatform.key === "otterly" ? (
                <>
                  <div className="settings-field">
                    <span className="settings-field-span">Otterly API Key <span className="settings-field-required">*</span></span>
                    <input
                      type="password"
                      required
                      placeholder="oai_live_..."
                      value={integrationForm.apiKey}
                      onChange={e => setIntegrationForm({ ...integrationForm, apiKey: e.target.value })}
                    />
                  </div>

                  <div className="settings-field">
                    <span className="settings-field-span">Workspace ID <span className="settings-field-required">*</span></span>
                    <input
                      type="text"
                      required
                      placeholder="01..."
                      value={integrationForm.workspaceId}
                      onChange={e => setIntegrationForm({ ...integrationForm, workspaceId: e.target.value })}
                    />
                    <small className="muted-text">Cortexy will discover and assign the matching Brand Report ID automatically.</small>
                  </div>

                  <div className="settings-field">
                    <span className="settings-field-span">Brand hint (optional)</span>
                    <input
                      type="text"
                      placeholder="Justclara"
                      value={integrationForm.brand}
                      onChange={e => setIntegrationForm({ ...integrationForm, brand: e.target.value })}
                    />
                  </div>

                  <div className="settings-field">
                    <span className="settings-field-span">Domain</span>
                    <input
                      type="text"
                      placeholder="justclara.ai"
                      value={integrationForm.brandDomain}
                      onChange={e => setIntegrationForm({ ...integrationForm, brandDomain: e.target.value })}
                    />
                  </div>

                  <div className="settings-field">
                    <span className="settings-field-span">Default Country</span>
                    <input
                      type="text"
                      placeholder="us"
                      value={integrationForm.defaultCountry}
                      onChange={e => setIntegrationForm({ ...integrationForm, defaultCountry: e.target.value.toLowerCase() })}
                    />
                  </div>
                </>
              ) : (
                <>
              <div className="settings-field">
                <span className="settings-field-span">API Client ID <span className="settings-field-required">*</span></span>
                <input 
                  type="text" 
                  required 
                  placeholder={`Enter your ${activeConnectingPlatform.name} Client ID`}
                  value={integrationForm.clientId}
                  onChange={e => setIntegrationForm({ ...integrationForm, clientId: e.target.value })}
                />
              </div>

              <div className="settings-field">
                <span className="settings-field-span">API Client Secret <span className="settings-field-required">*</span></span>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••••••••••"
                  value={integrationForm.clientSecret}
                  onChange={e => setIntegrationForm({ ...integrationForm, clientSecret: e.target.value })}
                />
              </div>
                </>
              )}

              <div className="settings-field">
                <span className="settings-field-span">Sync Interval</span>
                <select 
                  value={integrationForm.syncInterval}
                  onChange={e => setIntegrationForm({ ...integrationForm, syncInterval: e.target.value })}
                >
                  <option value="15m">Every 15 minutes</option>
                  <option value="1h">Every hour (Recommended)</option>
                  <option value="12h">Every 12 hours</option>
                  <option value="24h">Daily summary sync</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  checked={integrationForm.sandbox}
                  onChange={e => setIntegrationForm({ ...integrationForm, sandbox: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Use Sandbox / Developer Environment
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setActiveConnectingPlatform(null)} 
                className="secondary-button" 
                style={{ height: '40px', padding: '0 20px', background: '#f1f5f9', color: '#475569', boxShadow: 'none', border: '1px solid #e2e8f0' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-add-user secondary-button" 
                style={{ height: '40px', padding: '0 24px' }}
              >
                Connect Platform
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isCreateCompanyOpen ? (
        <div className="drawer-overlay open" onClick={() => setIsCreateCompanyOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="drawer-header">
              <h3>Register New Company / Business</h3>
              <button type="button" className="drawer-close" onClick={() => setIsCreateCompanyOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form className="drawer-form" onSubmit={handleCreateCompany} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label>
                  Company Name *
                  <input
                    value={newCompName}
                    onChange={(e) => {
                      setNewCompName(e.target.value);
                      setNewCompSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }}
                    placeholder="e.g. Acme Services"
                    required
                  />
                </label>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label>
                  Slug (URL identifier) *
                  <input
                    value={newCompSlug}
                    onChange={(e) => setNewCompSlug(e.target.value)}
                    placeholder="e.g. acme-services"
                    required
                  />
                </label>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label>
                  Tagline
                  <input
                    value={newCompTagline}
                    onChange={(e) => setNewCompTagline(e.target.value)}
                    placeholder="e.g. Premium contracting services"
                  />
                </label>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label>
                  Billing Address Line 1 *
                  <input
                    value={newCompAddr1}
                    onChange={(e) => setNewCompAddr1(e.target.value)}
                    placeholder="Street Address"
                    required
                  />
                </label>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label>
                  Billing Address Line 2
                  <input
                    value={newCompAddr2}
                    onChange={(e) => setNewCompAddr2(e.target.value)}
                    placeholder="Suite, Apt, etc. (Optional)"
                  />
                </label>
              </div>

              <div>
                <label>
                  City *
                  <input
                    value={newCompCity}
                    onChange={(e) => setNewCompCity(e.target.value)}
                    placeholder="City"
                    required
                  />
                </label>
              </div>

              <div>
                <label>
                  State *
                  <input
                    value={newCompState}
                    onChange={(e) => setNewCompState(e.target.value)}
                    placeholder="State / Province"
                    required
                  />
                </label>
              </div>

              <div>
                <label>
                  Country *
                  <input
                    value={newCompCountry}
                    onChange={(e) => setNewCompCountry(e.target.value)}
                    placeholder="Country"
                    required
                  />
                </label>
              </div>

              <div>
                <label>
                  Zipcode / Postal Code *
                  <input
                    value={newCompZipcode}
                    onChange={(e) => setNewCompZipcode(e.target.value)}
                    placeholder="Zipcode"
                    required
                  />
                </label>
              </div>

              <div>
                <label>
                  Administrator *
                  <input
                    value={newCompAdmin}
                    onChange={(e) => setNewCompAdmin(e.target.value)}
                    placeholder="Admin Full Name"
                    required
                  />
                </label>
              </div>

              <div>
                <label>
                  Cellphone
                  <input
                    value={newCompPhone}
                    onChange={(e) => setNewCompPhone(e.target.value)}
                    placeholder="Cellphone (Optional)"
                  />
                </label>
              </div>

              <div>
                <label>
                  Timezone
                  <select value={newCompTimezone} onChange={(e) => setNewCompTimezone(e.target.value)}>
                    <option value="America/Toronto">America/Toronto</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Denver">America/Denver</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="UTC">UTC</option>
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Locale
                  <select value={newCompLocale} onChange={(e) => setNewCompLocale(e.target.value)}>
                    <option value="en-US">en-US</option>
                    <option value="en-CA">en-CA</option>
                    <option value="en-GB">en-GB</option>
                    <option value="fr-FR">fr-FR</option>
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Language
                  <select value={newCompLanguage} onChange={(e) => setNewCompLanguage(e.target.value)}>
                    <option value="English">English</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Currency
                  <select value={newCompCurrency} onChange={(e) => setNewCompCurrency(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </label>
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <label>
                  Custom Branch Name (Optional)
                  <input
                    value={newCompBranchName}
                    onChange={(e) => setNewCompBranchName(e.target.value)}
                    placeholder="Leave blank for 0 branches"
                  />
                  <span className="muted-text" style={{ fontSize: '11px', display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                    If provided, this branch will be automatically created. Otherwise, the company will have 0 branches.
                  </span>
                </label>
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="button" className="secondary-button" style={{ flex: 1 }} onClick={() => setIsCreateCompanyOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, height: '42px' }}>
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("cortexy_token")) {
      setChecking(false);
      return;
    }

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
    return <main className="loading-screen">Loading Nexora AI...</main>;
  }

  return user ? <Dashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} /> : <Login onLogin={setUser} />;
}
