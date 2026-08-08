import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";

import {
  getAdminUsers,
  getAdminMetrics,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
  getSecurityEvents,
  getLockedAccounts,
  type AdminUser,
  type AdminMetrics,
  type SecurityEvent,
} from "../services/adminService";

import {
  Users,
  Database,
  ShieldAlert,
  UserCheck,
  Lock,
  Activity,
  MessageSquare,
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
} from "lucide-react";

import AdminMetricCard from "../components/admin/AdminMetricCard";

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [securityEvents, setSecurityEvents] =
    useState<SecurityEvent[]>([]);
  const [lockedAccounts, setLockedAccounts] =
    useState<AdminUser[]>([]);

  const [metrics, setMetrics] =
    useState<AdminMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
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
        ] = await Promise.all([
          getAdminUsers(),
          getAdminMetrics(),
          getSecurityEvents(),
          getLockedAccounts(),
        ]);

        setUsers(usersData.users);
        setMetrics(metricsData);
        setSecurityEvents(eventsData.events);
        setLockedAccounts(lockedData.users);
      } catch (error) {
        console.error(
          "Failed to load admin dashboard:",
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refreshUsers = async () => {
    const data = await getAdminUsers();
    setUsers(data.users);
  };

  const handleRoleChange = async (
    id: string,
    currentRole: string
  ) => {
    try {
      const newRole =
        currentRole === "ADMIN"
          ? "USER"
          : "ADMIN";

      await changeUserRole(id, newRole);

      await refreshUsers();
      await loadDashboard(true);
    } catch (error) {
      console.error(
        "Failed to change role:",
        error
      );
    }
  };

  const handleStatusToggle = async (
    id: string
  ) => {
    try {
      await toggleUserStatus(id);

      await refreshUsers();
      await loadDashboard(true);
    } catch (error) {
      console.error(
        "Failed to change status:",
        error
      );
    }
  };

  const handleDelete = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      "Delete this user permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(id);

      await loadDashboard(true);
    } catch (error) {
      console.error(
        "Failed to delete user:",
        error
      );
    }
  };

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.fullName
          .toLowerCase()
          .includes(query) ||
        user.username
          .toLowerCase()
          .includes(query) ||
        user.email
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <Activity className="animate-pulse" />
          Loading admin dashboard...
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
            <span>
              Failed to load admin dashboard.
            </span>
          </div>

          <button
            onClick={() => loadDashboard()}
            className="
              mt-4
              rounded-lg
              bg-cyan-600
              px-4
              py-2
              text-sm
              font-medium
              hover:bg-cyan-500
            "
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
            <ShieldAlert className="text-cyan-400" />

            <h1 className="text-3xl font-bold">
              Diralis Admin Control Center
            </h1>
          </div>

          <p className="mt-2 text-slate-400">
            Monitor and manage the Diralis AI
            decision intelligence platform.
          </p>
        </div>

        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-4
            py-3
            text-sm
            font-medium
            hover:border-cyan-500/50
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* Core Platform Metrics */}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          Platform
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          <AdminMetricCard
            title="Users"
            value={metrics.users.total}
            icon={<Users size={24} />}
          />

          <AdminMetricCard
            title="Verified Users"
            value={metrics.users.verified}
            icon={<UserCheck size={24} />}
          />

          <AdminMetricCard
            title="Datasets"
            value={metrics.datasets.total}
            icon={<Database size={24} />}
          />

          <AdminMetricCard
            title="Active Sessions"
            value={metrics.sessions.active}
            icon={<Activity size={24} />}
          />
        </div>
      </section>

      {/* Security */}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          Security
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          <AdminMetricCard
            title="Security Events"
            value={metrics.security.events}
            icon={<ShieldAlert size={24} />}
          />

          <AdminMetricCard
            title="Locked Accounts"
            value={
              metrics.security.lockedAccounts
            }
            icon={<Lock size={24} />}
          />

          <AdminMetricCard
            title="Total Sessions"
            value={metrics.sessions.total}
            icon={<Server size={24} />}
          />
        </div>
      </section>

      {/* Chat */}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          AI Usage
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
          "
        >
          <AdminMetricCard
            title="Chat Sessions"
            value={metrics.chat.sessions}
            icon={<MessageSquare size={24} />}
          />

          <AdminMetricCard
            title="Chat Messages"
            value={metrics.chat.messages}
            icon={<MessageSquare size={24} />}
          />
        </div>
      </section>

      {/* Billing */}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          Billing
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          <AdminMetricCard
            title="Plans"
            value={
              metrics.billing.subscriptionPlans.total
            }
            description={`${metrics.billing.subscriptionPlans.active} active`}
            icon={<CreditCard size={24} />}
          />

          <AdminMetricCard
            title="Subscriptions"
            value={
              metrics.billing.subscriptions.total
            }
            description={`${metrics.billing.subscriptions.active} active`}
            icon={<Wallet size={24} />}
          />

          <AdminMetricCard
            title="Successful Payments"
            value={
              metrics.billing.payments.successful
            }
            description={`${metrics.billing.payments.total} total`}
            icon={<CheckCircle size={24} />}
          />

          <AdminMetricCard
            title="Failed Payments"
            value={
              metrics.billing.payments.failed
            }
            description={`${metrics.billing.payments.pending} pending`}
            icon={<AlertTriangle size={24} />}
          />

          <AdminMetricCard
            title="Billing Webhooks"
            value={
              metrics.billing.webhooks.total
            }
            description={`${metrics.billing.webhooks.unprocessed} unprocessed`}
            icon={<Webhook size={24} />}
          />

          <AdminMetricCard
            title="Billing Providers"
            value={
              metrics.billing.providers.total
            }
            description={`${metrics.billing.providers.enabled} enabled`}
            icon={<Server size={24} />}
          />
        </div>
      </section>

      {/* Search / Filters */}

      <section className="mt-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-slate-500
              "
            />

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-900
                py-3
                pl-11
                pr-4
                outline-none
                focus:border-cyan-500
              "
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              px-4
              py-3
              outline-none
              focus:border-cyan-500
            "
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="ADMIN">
              Admin
            </option>

            <option value="USER">
              User
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              px-4
              py-3
              outline-none
              focus:border-cyan-500
            "
          >
            <option value="ALL">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="SUSPENDED">
              Suspended
            </option>

            <option value="PENDING_VERIFICATION">
              Pending Verification
            </option>
          </select>
        </div>
      </section>

      {/* Security Events */}

      <section
        className="
          mt-8
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Recent Security Events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest authentication and account
              security activity.
            </p>
          </div>

          <ShieldAlert
            size={22}
            className="text-cyan-400"
          />
        </div>

        {securityEvents.length === 0 ? (
          <p className="mt-5 text-slate-500">
            No security events recorded.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {securityEvents
              .slice(0, 10)
              .map((event) => (
                <div
                  key={event.id}
                  className="
                    rounded-xl
                    border
                    border-slate-800
                    p-4
                  "
                >
                  <div className="flex flex-col justify-between gap-2 md:flex-row">
                    <div>
                      <div className="font-medium">
                        {event.action}
                      </div>

                      <div className="text-sm text-slate-400">
                        {event.user?.username ||
                          "Unknown user"}
                      </div>
                    </div>

                    <div className="text-sm text-slate-500">
                      {new Date(
                        event.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>

                  {event.details && (
                    <p className="mt-2 text-sm text-slate-500">
                      {event.details}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Locked Accounts */}

      <section
        className="
          mt-8
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >
        <div className="flex items-center gap-3">
          <Lock
            size={22}
            className="text-yellow-400"
          />

          <div>
            <h2 className="text-xl font-semibold">
              Locked Accounts
            </h2>

            <p className="text-sm text-slate-500">
              Accounts currently under login lockout.
            </p>
          </div>
        </div>

        {lockedAccounts.length === 0 ? (
          <p className="mt-5 text-slate-500">
            No accounts are currently locked.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {lockedAccounts.map((user) => (
              <div
                key={user.id}
                className="
                  rounded-xl
                  border
                  border-yellow-500/20
                  bg-yellow-500/5
                  p-4
                "
              >
                <div className="font-semibold">
                  {user.fullName}
                </div>

                <div className="text-sm text-slate-400">
                  @{user.username}
                </div>

                <div className="mt-3 text-sm text-yellow-400">
                  Failed attempts:{" "}
                  {user.failedLoginAttempts}
                </div>

                {user.lockedUntil && (
                  <div className="mt-1 text-sm text-slate-500">
                    Locked until:{" "}
                    {new Date(
                      user.lockedUntil
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Users */}

      <section
        className="
          mt-8
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Platform Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredUsers.length} of{" "}
              {users.length} users shown.
            </p>
          </div>

          <Users
            size={22}
            className="text-cyan-400"
          />
        </div>

        {filteredUsers.length === 0 ? (
          <p className="mt-5 text-slate-500">
            No users match the current filters.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredUsers.map((user) => {
              const isCurrentUser =
                currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className="
                    rounded-xl
                    border
                    border-slate-800
                    p-4
                    transition
                    hover:border-cyan-500/30
                  "
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          {user.fullName}
                        </div>

                        {isCurrentUser && (
                          <span
                            className="
                              rounded-full
                              bg-blue-500/20
                              px-2
                              py-1
                              text-xs
                              text-blue-400
                            "
                          >
                            You
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-400">
                        @{user.username}
                      </div>

                      <div className="mt-1 break-all text-sm text-slate-300">
                        {user.email}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className="
                            rounded-full
                            bg-cyan-500/10
                            px-3
                            py-1
                            text-xs
                            text-cyan-400
                          "
                        >
                          {user.role}
                        </span>

                        <span
                          className={`
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            ${
                              user.status ===
                              "ACTIVE"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }
                          `}
                        >
                          {user.status}
                        </span>

                        <span
                          className="
                            rounded-full
                            bg-slate-800
                            px-3
                            py-1
                            text-xs
                            text-slate-400
                          "
                        >
                          {user.provider}
                        </span>

                        {user.emailVerified && (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1
                              rounded-full
                              bg-green-500/10
                              px-3
                              py-1
                              text-xs
                              text-green-400
                            "
                          >
                            <CheckCircle
                              size={12}
                            />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isCurrentUser ? (
                        <span
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-blue-500/10
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-blue-400
                          "
                        >
                          <UserCog size={16} />
                          Current Administrator
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              handleRoleChange(
                                user.id,
                                user.role
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-1
                              rounded-lg
                              bg-cyan-600
                              px-3
                              py-2
                              text-xs
                              font-medium
                              hover:bg-cyan-500
                            "
                          >
                            <UserCog
                              size={14}
                            />

                            {user.role ===
                            "ADMIN"
                              ? "Demote"
                              : "Promote"}
                          </button>

                          <button
                            onClick={() =>
                              handleStatusToggle(
                                user.id
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-1
                              rounded-lg
                              bg-yellow-600
                              px-3
                              py-2
                              text-xs
                              font-medium
                              hover:bg-yellow-500
                            "
                          >
                            {user.status ===
                            "ACTIVE" ? (
                              <>
                                <Ban
                                  size={14}
                                />
                                Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle
                                  size={14}
                                />
                                Activate
                              </>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                user.id
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-1
                              rounded-lg
                              bg-red-600
                              px-3
                              py-2
                              text-xs
                              font-medium
                              hover:bg-red-500
                            "
                          >
                            <Trash2
                              size={14}
                            />
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
        )}
      </section>
    </div>
  );
}


