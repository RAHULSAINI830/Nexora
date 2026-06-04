import React, { useEffect, useMemo, useState } from "react";
import { 
  AlertCircle, BarChart3, CheckCircle, Database, Link, Pencil, RefreshCcw, 
  Settings, Shield, Trash2, User, UserPlus, Users, X, Activity, Briefcase, 
  DollarSign, Cpu, Sliders, Globe, MapPin, Send, Zap, FileText, Download, 
  Award, TrendingUp, Building, Clock, LogOut, Eye, EyeOff
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

  if (roleName === "SUPER_ADMIN" || roleName === "DEVELOPER") {
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
                const globalUsers = managedUsers.filter(u => !u.branchId);
                const branchUsers = (bId) => managedUsers.filter(u => u.branchId === bId);
                
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

  if (roleName === "BUSINESS_OWNER") {
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

const integrationPlatforms = [
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
  const [accounts, setAccounts] = useState([]);
  const [managedUsers, setManagedUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
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
  const [userMgmtCompanyFilter, setUserMgmtCompanyFilter] = useState(() => (user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") ? "all" : "");
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
  const [activeConnectingPlatform, setActiveConnectingPlatform] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({
    apiKey: "",
    clientId: "",
    clientSecret: "",
    syncInterval: "1h",
    sandbox: true
  });

  const activeIntegrationAccountId = (user.role === "DEVELOPER" || user.role === "SUPER_ADMIN")
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

  useEffect(() => {
    loadIntegrations();
  }, [activeIntegrationAccountId]);

  const handleConnectIntegration = async (e) => {
    e.preventDefault();
    if (!activeConnectingPlatform) return;

    if (!activeIntegrationAccountId) {
      setNotice("Select a company before connecting an integration.");
      return;
    }

    await apiRequest(`/accounts/${activeIntegrationAccountId}/integrations/${activeConnectingPlatform.key}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "connected",
        config: integrationForm
      })
    });

    setActiveConnectingPlatform(null);
    setIntegrationForm({ apiKey: "", clientId: "", clientSecret: "", syncInterval: "1h", sandbox: true });
    await loadIntegrations(activeIntegrationAccountId);
    setNotice(`${activeConnectingPlatform.name} connected successfully.`);
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
    const currentCompany = (user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") 
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
      const targetCompanyId = (user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") 
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
  const canManageAccounts = user.role === "SUPER_ADMIN" || user.role === "DEVELOPER";
  const canManageUsers = user.role === "SUPER_ADMIN" || user.role === "DEVELOPER" || user.role === "BUSINESS_OWNER";

  async function loadDashboard(accountId = selectedAccountId) {
    setLoading(true);
    const query = accountId ? `?accountId=${accountId}` : "";
    const data = await apiRequest(`/dashboard/records${query}`);
    setRecords(data.records);
    setLoading(false);
  }

  async function loadUsers(accountId) {
    if (!canManageUsers) return;
    setUsersLoading(true);
    const targetId = accountId !== undefined ? accountId : ((user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") ? userMgmtCompanyFilter : selectedAccountId);
    const query = targetId ? `?accountId=${targetId}` : "";
    const data = await apiRequest(`/auth/users${query}`);
    setManagedUsers(data.users);
    setUsersLoading(false);
  }

  async function loadAdmins(accountId = selectedAccountId) {
    if (!canManageUsers) return;
    const query = accountId ? `?accountId=${accountId}` : "";
    const data = await apiRequest(`/auth/admins${query}`);
    setAdmins(data.admins);
    setUserForm((current) => ({
      ...current,
      adminId: data.admins.some((admin) => admin.id === current.adminId) ? current.adminId : data.admins[0]?.id ?? ""
    }));
  }

  async function loadBranches(accountId = selectedAccountId || user.accountId) {
    if (!accountId) return;
    const query = `?accountId=${accountId}`;
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
        const initialCompanyFilter = (user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") ? "all" : selectedAccountId;
        await loadUsers(initialCompanyFilter);
        await loadAdmins(initialCompanyFilter || selectedAccountId);
        await loadBranches(initialCompanyFilter || selectedAccountId || user.accountId);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    localStorage.setItem("cortexy_activeView", activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem("cortexy_settingsTab", settingsTab);
  }, [settingsTab]);

  async function handleSync() {
    setNotice("");
    const body = (user.role === "SUPER_ADMIN" || user.role === "DEVELOPER") ? { accountId: selectedAccountId } : {};

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
        payload.accountId = (user.role === "SUPER_ADMIN" || user.role === "DEVELOPER") ? userForm.accountId : user.accountId;
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

  const totals = useMemo(() => {
    const healthy = records.filter((record) => record.status === "healthy").length;
    const accountsVisible = canManageAccounts ? accounts.length : user.accountId ? 1 : 0;

    return {
      records: records.length,
      healthy,
      accounts: accountsVisible,
      users: managedUsers.length
    };
  }, [records, accounts, canManageAccounts, user.accountId, managedUsers]);

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

      return matchSearch && matchRole;
    });
  }, [groupedUsers, searchTerm, filterRole]);

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
        <div className="tree-user-card" style={{
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
            <span className={`verification-status ${node.emailVerified ? "verified" : "pending"}`}>
              {node.emailVerified ? "Verified" : "Pending"}
            </span>
            {node.branch?.name && (
              <span style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#5c6cf2' }}>
                {node.branch.name}
              </span>
            )}
            
            {ROLE_LEVELS[node.role] < (ROLE_LEVELS[user.role] || 0) || (user.role === "DEVELOPER" && !node.emailVerified) ? (
              <div className="action-buttons" style={{ display: 'flex', gap: '4px' }}>
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

  const pageTitle = {
    dashboard: (user.role === "SUPER_ADMIN" || user.role === "DEVELOPER") ? "All Accounts" : user.account?.name ?? "Assigned Account",
    data: "Stored API Data",
    settings: "Settings"
  }[activeView];

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
              onClick={() => setActiveView("dashboard")}
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`sidebar-nav-btn ${activeView === "data" ? "active" : ""}`} 
              onClick={() => setActiveView("data")}
            >
              <Database size={18} />
              <span>Data Store</span>
            </button>
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
          <>
            <section key="dashboard-metrics" className="metrics-grid tab-transition">
              <MetricCard label="Stored records" value={totals.records} icon={Database} />
              <MetricCard label="Healthy metrics" value={totals.healthy} icon={BarChart3} />
              <MetricCard label={canManageUsers ? "Managed users" : "Visible accounts"} value={canManageUsers ? totals.users : totals.accounts} icon={Users} />
            </section>
            
            {/* Custom interactive dashboard matching role capabilities */}
            <RoleDashboard 
              user={user} 
              records={records} 
              accounts={accounts} 
              branches={branches} 
              onSync={handleSync} 
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              loadDashboard={loadDashboard}
              loadUsers={loadUsers}
              loadAdmins={loadAdmins}
              loadBranches={loadBranches}
              managedUsers={managedUsers}
            />
          </>
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
                {(user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") && (
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

                      {(user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") && (
                        <select
                          value={userMgmtCompanyFilter}
                          onChange={(e) => {
                            const newFilter = e.target.value;
                            setUserMgmtCompanyFilter(newFilter);
                            loadUsers(newFilter);
                            loadAdmins(newFilter !== 'all' ? newFilter : selectedAccountId);
                            loadBranches(newFilter !== 'all' ? newFilter : selectedAccountId || user.accountId);
                          }}
                          className="premium-filter-select"
                        >
                          <option value="all">All Companies</option>
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
                    <section className="role-hierarchy-reference" aria-label="Role hierarchy">
                      <h4>Role Hierarchy</h4>
                      <div className="role-hierarchy-tree">
                        <div className="role-hierarchy-node role-developer">Developer</div>
                        <div className="role-hierarchy-children">
                          <div className="role-hierarchy-node role-super_admin">Super Admin</div>
                          <div className="role-hierarchy-children">
                            <div className="role-hierarchy-node role-business_owner">Business Owner</div>
                            <div className="role-hierarchy-children role-hierarchy-grid">
                              <div className="role-hierarchy-node role-marketing_manager">Marketing Manager</div>
                              <div className="role-hierarchy-node role-operations_manager">Operations Manager</div>
                              <div className="role-hierarchy-branch">
                                <div className="role-hierarchy-node role-branch_manager">Branch Manager</div>
                                <div className="role-hierarchy-children">
                                  <div className="role-hierarchy-node role-technician">Technician</div>
                                </div>
                              </div>
                              <div className="role-hierarchy-node role-analyst">Read-Only Analyst</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
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
                            {(user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") && group.id !== "global" && group.id !== user.accountId && (
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
                          <tr key={managedUser.id} className="user-row">
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
                              <span className={`verification-status ${managedUser.emailVerified ? "verified" : "pending"}`}>
                                {managedUser.emailVerified ? "Verified" : "Pending"}
                              </span>
                            </td>
                             <td className="align-right">
                              {ROLE_LEVELS[managedUser.role] < (ROLE_LEVELS[user.role] || 0) || (user.role === "DEVELOPER" && !managedUser.emailVerified) ? (
                                <div className="action-buttons">
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
                      {(user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") ? (
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
                <div className="users-filter-bar" style={{ marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Company Integration Control</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                      Connect one or more platforms for the selected company. New companies start with all platforms available and disconnected.
                    </p>
                  </div>
                  {(user.role === "DEVELOPER" || user.role === "SUPER_ADMIN") ? (
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
                      {integrationPlatforms.map((platform) => {
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
                                  onClick={() => setActiveConnectingPlatform(platform)}
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

        {activeView === "dashboard" || activeView === "data" ? (
          <section key="dashboard-data" className="data-section tab-transition">
            <div className="section-header">
              <h2>Dashboard data</h2>
              <span>{loading ? "Loading..." : `${records.length} rows`}</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th className="align-right">Value</th>
                    <th>Status</th>
                    <th>Account</th>
                    <th className="align-right">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="data-row">
                      <td><strong className="metric-title">{record.title}</strong></td>
                      <td className="align-right font-mono value-cell">{record.metric.toLocaleString()}</td>
                      <td>
                        <span className={`status ${record.status}`}>
                          {record.status === "healthy" ? <CheckCircle size={14} style={{marginRight: '6px'}}/> : null}
                          {record.status === "attention" ? <AlertCircle size={14} style={{marginRight: '6px'}}/> : null}
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="account-cell">
                          <Database size={14} className="cell-icon"/>
                          {record.account?.name ?? "Global"}
                        </div>
                      </td>
                      <td className="align-right muted-text font-mono" style={{fontSize: '12px'}}>{new Date(record.occurredAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!records.length && !loading ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        <div className="empty-state-content">
                          <Database size={32} className="empty-icon" />
                          <p>No stored records yet. Sync the API to create the first dashboard rows.</p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
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
