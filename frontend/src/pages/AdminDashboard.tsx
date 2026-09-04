import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAdminUsers,
  getAdminMetrics,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
  getSecurityEvents,
  getLockedAccounts,
  getSecurityTelemetryMetrics,
  unlockUserAccount,
  getUserPasskeysAdmin,
  revokeUserPasskeyAdmin,
  getAdminSubscriptions,
  getAdminPayments,
  getAdminRevenueMetrics,
  adminOverrideSubscription,
  type AdminUser,
  type AdminMetrics,
  type SecurityEvent,
  type SecurityTelemetryMetrics,
  type UserPasskeyAdmin,
  type AdminSubscription,
  type AdminPayment,
  type RevenueMetrics,
} from "../services/adminService";

import {
  Users,
  ShieldAlert,
  Activity,
  CreditCard,
  Wallet,
  Webhook,
  Server,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  Ban,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Receipt,
  Layers,
  Fingerprint,
  Monitor,
  Unlock,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from "lucide-react";

import AdminMetricCard from "../components/admin/AdminMetricCard";

type AdminTab = "overview" | "users" | "subscriptions" | "payments" | "security";

function formatMoney(amountInCents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getActionBadgeStyle(action: string) {
  switch (action) {
    case "LOGIN_SUCCESS":
    case "EMAIL_VERIFIED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "WEBAUTHN_REGISTERED":
    case "TWO_FACTOR_ENABLED":
    case "TWO_FACTOR_VERIFIED":
    case "WEBAUTHN_AUTHENTICATED":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "FAILED_LOGIN":
    case "ACCOUNT_LOCKED":
    case "ACCOUNT_DISABLED":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "WEBAUTHN_REVOKED":
    case "TWO_FACTOR_DISABLED":
    case "PASSWORD_CHANGED":
    case "ROLE_CHANGED":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<AdminUser[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityTelemetryMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subStatusFilter, setSubStatusFilter] = useState("ALL");
  const [securityActionFilter, setSecurityActionFilter] = useState("ALL");

  // Security Pagination
  const [securityPage, setSecurityPage] = useState(1);
  const [securityTotalPages, setSecurityTotalPages] = useState(1);
  const [securitySearch, setSecuritySearch] = useState("");

  // Override Subscription Modal
  const [selectedSub, setSelectedSub] = useState<AdminSubscription | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [overrideStatus, setOverrideStatus] = useState<string>("");
  const [updatingSub, setUpdatingSub] = useState(false);

  // Passkey Audit Modal
  const [passkeyModalUser, setPasskeyModalUser] = useState<AdminUser | null>(null);
  const [userPasskeys, setUserPasskeys] = useState<UserPasskeyAdmin[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        usersData,
        metricsData,
        eventsData,
        lockedData,
        telemetryData,
        subsData,
        paymentsData,
        revenueData,
      ] = await Promise.all([
        getAdminUsers(),
        getAdminMetrics(),
        getSecurityEvents({ page: securityPage, limit: 25, action: securityActionFilter, search: securitySearch }),
        getLockedAccounts(),
        getSecurityTelemetryMetrics().catch(() => null),
        getAdminSubscriptions(),
        getAdminPayments(),
        getAdminRevenueMetrics(),
      ]);

      setUsers(usersData.users);
      setMetrics(metricsData);
      setSecurityEvents(eventsData.events);
      setSecurityTotalPages(eventsData.pagination?.pages || 1);
      setLockedAccounts(lockedData.users);
      setSecurityMetrics(telemetryData);
      setSubscriptions(subsData.subscriptions);
      setPayments(paymentsData.payments);
      setRevenue(revenueData);
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [securityPage, securityActionFilter, securitySearch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRoleChange = async (id: string, currentRole: string) => {
    try {
      const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
      await changeUserRole(id, newRole);
      await loadDashboard(true);
    } catch (error) {
      console.error("Failed to change role:", error);
    }
  };

  const handleStatusToggle = async (id: string) => {
    try {
      await toggleUserStatus(id);
      await loadDashboard(true);
    } catch (error) {
      console.error("Failed to change status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await deleteUser(id);
      await loadDashboard(true);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleUnlockAccount = async (userId: string) => {
    try {
      setActionLoading(true);
      await unlockUserAccount(userId);
      await loadDashboard(true);
    } catch (error) {
      console.error("Failed to unlock user account:", error);
      alert("Failed to unlock account.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectPasskeys = async (user: AdminUser) => {
    setPasskeyModalUser(user);
    setLoadingPasskeys(true);
    try {
      const res = await getUserPasskeysAdmin(user.id);
      setUserPasskeys(res.passkeys);
    } catch (error) {
      console.error("Failed to load user passkeys:", error);
      setUserPasskeys([]);
    } finally {
      setLoadingPasskeys(false);
    }
  };

  const handleRevokePasskey = async (passkeyId: string) => {
    if (!window.confirm("Are you sure you want to revoke this passkey? The user will no longer be able to log in with this hardware key.")) return;
    try {
      await revokeUserPasskeyAdmin(passkeyId);
      if (passkeyModalUser) {
        const res = await getUserPasskeysAdmin(passkeyModalUser.id);
        setUserPasskeys(res.passkeys);
      }
      await loadDashboard(true);
    } catch (error) {
      console.error("Failed to revoke passkey:", error);
      alert("Failed to revoke passkey.");
    }
  };

  const handleSaveSubOverride = async () => {
    if (!selectedSub) return;
    try {
      setUpdatingSub(true);
      await adminOverrideSubscription(selectedSub.id, {
        status: overrideStatus || undefined,
        extendDays: extendDays > 0 ? extendDays : undefined,
      });
      setSelectedSub(null);
      await loadDashboard(true);
    } catch (error) {
      console.error("Failed to override subscription:", error);
      alert("Failed to update subscription");
    } finally {
      setUpdatingSub(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.fullName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      const matchesSearch =
        !query ||
        sub.user.fullName.toLowerCase().includes(query) ||
        sub.user.email.toLowerCase().includes(query) ||
        sub.plan.name.toLowerCase().includes(query);

      const matchesStatus =
        subStatusFilter === "ALL" || sub.status === subStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, subStatusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <Activity className="animate-pulse text-cyan-400" />
          Loading admin control center...
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle />
            <span>Failed to load admin dashboard.</span>
          </div>
          <button
            onClick={() => loadDashboard()}
            className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-cyan-400" size={28} />
            <h1 className="text-3xl font-bold">Diralis Admin Control Center</h1>
          </div>
          <p className="mt-2 text-slate-400">
            Enterprise infrastructure, security telemetry, audit logs, and subscription operations.
          </p>
        </div>

        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium hover:border-cyan-500/50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin text-cyan-400" : ""} />
          Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "security", label: "Security & Telemetry", icon: ShieldAlert },
          { id: "subscriptions", label: "Subscriptions & Revenue", icon: DollarSign },
          { id: "payments", label: "Transactions", icon: Receipt },
          { id: "users", label: "Users & Access", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === "security" && lockedAccounts.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                  {lockedAccounts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="mt-8 space-y-8">
          {revenue && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-200">Revenue & MRR</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AdminMetricCard
                  title="Monthly Recurring (MRR)"
                  value={formatMoney(revenue.mrr, revenue.currency)}
                  icon={<DollarSign size={24} />}
                />
                <AdminMetricCard
                  title="Annual Run Rate (ARR)"
                  value={formatMoney(revenue.arr, revenue.currency)}
                  icon={<TrendingUp size={24} />}
                />
                <AdminMetricCard
                  title="Active Paid Subscribers"
                  value={revenue.activeSubscribers}
                  icon={<Wallet size={24} />}
                />
                <AdminMetricCard
                  title="Total Revenue Collected"
                  value={formatMoney(revenue.totalCollected, revenue.currency)}
                  icon={<CreditCard size={24} />}
                />
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Security & Infrastructure</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard
                title="Total Registered Users"
                value={metrics.users.total}
                description={`${metrics.users.verified} email verified`}
                icon={<Users size={24} />}
              />
              <AdminMetricCard
                title="Passkey Credentials"
                value={metrics.security?.totalPasskeys ?? securityMetrics?.totalPasskeys ?? 0}
                description="Biometric / hardware keys active"
                icon={<Fingerprint size={24} />}
              />
              <AdminMetricCard
                title="Active Sessions"
                value={metrics.sessions.active}
                description={`${metrics.sessions.total} lifetime authenticated`}
                icon={<Activity size={24} />}
              />
              <AdminMetricCard
                title="Security Events (24h Failed)"
                value={metrics.security?.recentFailedLogins ?? securityMetrics?.failedLogins24h ?? 0}
                description={`${lockedAccounts.length} accounts locked`}
                icon={<ShieldAlert size={24} />}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Billing Engine</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard
                title="Active Plans"
                value={metrics.billing.subscriptionPlans.active}
                description={`${metrics.billing.subscriptionPlans.total} total tiers`}
                icon={<CreditCard size={24} />}
              />
              <AdminMetricCard
                title="Successful Payments"
                value={metrics.billing.payments.successful}
                description={`${metrics.billing.payments.total} total attempted`}
                icon={<CheckCircle size={24} />}
              />
              <AdminMetricCard
                title="Webhooks Processed"
                value={metrics.billing.webhooks.processed}
                description={`${metrics.billing.webhooks.unprocessed} pending`}
                icon={<Webhook size={24} />}
              />
              <AdminMetricCard
                title="Enabled Providers"
                value={metrics.billing.providers.enabled}
                description={`${metrics.billing.providers.total} configured`}
                icon={<Server size={24} />}
              />
            </div>
          </section>
        </div>
      )}

      {/* TAB: SECURITY & TELEMETRY */}
      {activeTab === "security" && (
        <div className="mt-8 space-y-8">
          {/* Security Metrics Header Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <div className="flex items-center justify-between text-cyan-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Passkeys Registered</span>
                <Fingerprint size={20} />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {securityMetrics?.totalPasskeys ?? metrics.security.totalPasskeys ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-400">FIDO2 / WebAuthn credentials active</p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-center justify-between text-red-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Failed Logins (24h)</span>
                <ShieldAlert size={20} />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {securityMetrics?.failedLogins24h ?? metrics.security.recentFailedLogins ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-400">Anomalous or brute-force spikes</p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Locked Accounts</span>
                <AlertTriangle size={20} />
              </div>
              <div className="mt-2 text-2xl font-bold">{lockedAccounts.length}</div>
              <p className="mt-1 text-xs text-slate-400">Automated lockout mitigation active</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-semibold uppercase tracking-wider">2FA Adoption</span>
                <ShieldCheck size={20} />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {metrics.users.twoFactorAdoption ?? 0} Users
              </div>
              <p className="mt-1 text-xs text-slate-400">Enrolled in Passkeys or TOTP</p>
            </div>
          </div>

          {/* Locked Accounts & Immediate Action */}
          {lockedAccounts.length > 0 && (
            <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-400" size={24} />
                  <div>
                    <h3 className="font-bold text-red-200">Locked User Accounts</h3>
                    <p className="text-xs text-red-300">
                      These accounts were automatically locked due to exceeding maximum failed authentication attempts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {lockedAccounts.map((user) => (
                  <div key={user.id} className="rounded-xl border border-red-500/20 bg-slate-900/80 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-white">{user.fullName}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
                        {user.failedLoginAttempts} attempts
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                      <span className="text-slate-400">
                        Locked until: {user.lockedUntil ? new Date(user.lockedUntil).toLocaleTimeString() : "—"}
                      </span>
                      <button
                        onClick={() => handleUnlockAccount(user.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <Unlock size={12} />
                        Unlock Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search, Filter & Audit Log Section */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-bold">Security Audit Telemetry</h3>
                <p className="text-xs text-slate-400">
                  Full cryptographic authentication events, hardware passkey operations, and reverse-proxy client telemetry.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search IP, email, device, or details..."
                    value={securitySearch}
                    onChange={(e) => setSecuritySearch(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs outline-none focus:border-cyan-500"
                  />
                </div>

                <select
                  value={securityActionFilter}
                  onChange={(e) => {
                    setSecurityActionFilter(e.target.value);
                    setSecurityPage(1);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Actions</option>
                  <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                  <option value="FAILED_LOGIN">FAILED_LOGIN</option>
                  <option value="WEBAUTHN_REGISTERED">WEBAUTHN_REGISTERED</option>
                  <option value="WEBAUTHN_AUTHENTICATED">WEBAUTHN_AUTHENTICATED</option>
                  <option value="WEBAUTHN_REVOKED">WEBAUTHN_REVOKED</option>
                  <option value="TWO_FACTOR_VERIFIED">TWO_FACTOR_VERIFIED</option>
                  <option value="USER_CREATED">USER_CREATED</option>
                  <option value="ROLE_CHANGED">ROLE_CHANGED</option>
                </select>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 uppercase tracking-wider text-slate-400">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Device & OS</th>
                    <th className="p-3.5">IP Address</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-800 font-mono">
                  {securityEvents.map((event) => (
                    <tr key={event.id} className="text-slate-300 hover:bg-slate-900/60 font-sans">
                      <td className="p-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getActionBadgeStyle(
                            event.action
                          )}`}
                        >
                          {event.action}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-sans">
                        {event.user ? (
                          <div>
                            <div className="font-medium text-white">{event.user.fullName}</div>
                            <div className="text-[11px] text-slate-400">{event.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unauthenticated</span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Monitor size={14} className="text-slate-500" />
                          <span className="text-[11px]">{event.device || "Unknown Device"}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-cyan-400">
                        {event.ipAddress || "—"}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin size={12} className="text-slate-500" />
                          <span className="text-[11px]">
                            {event.city && event.country
                              ? `${event.city}, ${event.country}`
                              : event.country || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={event.details || ""}>
                        {event.details || "—"}
                      </td>
                    </tr>
                  ))}
                  {securityEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No security telemetry events match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Page {securityPage} of {securityTotalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSecurityPage((p) => Math.max(1, p - 1))}
                  disabled={securityPage <= 1}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-2 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setSecurityPage((p) => Math.min(securityTotalPages, p + 1))}
                  disabled={securityPage >= securityTotalPages}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-2 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB: SUBSCRIPTIONS & REVENUE */}
      {activeTab === "subscriptions" && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold">Subscription Management</h2>
              <p className="text-sm text-slate-400">
                View, filter, and manually override user subscriptions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search customer or plan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={subStatusFilter}
                onChange={(e) => setSubStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIALING">Trialing</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="INCOMPLETE">Incomplete</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Interval</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Current Period</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-800">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="p-4">
                      <div className="font-semibold text-white">{sub.user.fullName}</div>
                      <div className="text-xs text-slate-400">{sub.user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400">
                        {sub.plan.name}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{sub.interval ?? "—"}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : sub.status === "TRIALING"
                            ? "bg-blue-500/10 text-blue-400"
                            : sub.status === "PAST_DUE"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setOverrideStatus(sub.status);
                        }}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                      >
                        Override / Extend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PAYMENTS */}
      {activeTab === "payments" && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold">Platform Transactions Log</h2>
            <p className="text-sm text-slate-400">
              Audit log of all payments and provider transactions.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-800">
                {payments.map((payment) => (
                  <tr key={payment.id} className="text-slate-300">
                    <td className="p-4 text-xs text-slate-400">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{payment.user.fullName}</div>
                      <div className="text-xs text-slate-400">{payment.user.email}</div>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="p-4 text-xs text-slate-400">{payment.provider}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {payment.providerReference}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          payment.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : payment.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: USERS & PASSKEY INSPECTION */}
      {activeTab === "users" && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isCurrentUser = currentUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    className="rounded-xl border border-slate-800 p-4 transition hover:border-cyan-500/30"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{user.fullName}</div>
                          {isCurrentUser && (
                            <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">@{user.username}</div>
                        <div className="mt-1 break-all text-sm text-slate-300">{user.email}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
                            {user.role}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              user.status === "ACTIVE"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {user.status}
                          </span>
                          {user.twoFactorEnabled && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300">
                              <Fingerprint size={12} />
                              Passkey/2FA Active
                            </span>
                          )}
                          {user.emailVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">
                              <CheckCircle size={12} />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleInspectPasskeys(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-white"
                        >
                          <KeyRound size={14} className="text-cyan-400" />
                          Passkeys
                        </button>

                        {isCurrentUser ? (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                            <UserCog size={16} />
                            Administrator
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRoleChange(user.id, user.role)}
                              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium hover:bg-cyan-500"
                            >
                              <UserCog size={14} />
                              {user.role === "ADMIN" ? "Demote" : "Promote"}
                            </button>
                            <button
                              onClick={() => handleStatusToggle(user.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-yellow-600 px-3 py-2 text-xs font-medium hover:bg-yellow-500"
                            >
                              {user.status === "ACTIVE" ? (
                                <>
                                  <Ban size={14} />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={14} />
                                  Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium hover:bg-red-500"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* USER PASSKEY AUDIT MODAL */}
      {passkeyModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint size={22} className="text-cyan-400" />
                <h3 className="text-lg font-bold">Passkey Credentials</h3>
              </div>
              <button
                onClick={() => setPasskeyModalUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Registered hardware & biometric authenticators for{" "}
              <span className="font-medium text-white">{passkeyModalUser.fullName}</span> ({passkeyModalUser.email})
            </p>

            <div className="mt-4 space-y-3">
              {loadingPasskeys ? (
                <div className="p-6 text-center text-xs text-slate-500 animate-pulse">
                  Querying cryptographic credentials...
                </div>
              ) : userPasskeys.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                  No WebAuthn passkeys or security keys enrolled for this user.
                </div>
              ) : (
                userPasskeys.map((pk) => (
                  <div key={pk.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <div>
                      <div className="text-sm font-semibold text-white">{pk.name}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Type: {pk.deviceType}</span>
                        <span>•</span>
                        <span>Created: {formatDate(pk.createdAt)}</span>
                        <span>•</span>
                        <span>Last used: {pk.lastUsedAt ? formatDate(pk.lastUsedAt) : "Never"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokePasskey(pk.id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPasskeyModalUser(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE SUBSCRIPTION MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Override User Subscription</h3>
            <p className="mt-1 text-xs text-slate-400">
              Customer: <span className="text-white font-medium">{selectedSub.user.fullName}</span> ({selectedSub.user.email})
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIALING">TRIALING</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Extend Period By (Days)
                </label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedSub(null)}
                disabled={updatingSub}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubOverride}
                disabled={updatingSub}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {updatingSub ? "Saving..." : "Apply Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



