import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";


import {
  getAdminUsers,
  getAdminMetrics,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
} from "../services/adminService";

import {
  Users,
  Database,
  FileText,
  Bot,
} from "lucide-react";

import AdminMetricCard from "../components/admin/AdminMetricCard";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  provider: string;
  createdAt: string;
}

export default function AdminDashboard() {

  const { user: currentUser } = useAuth();

  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [metrics, setMetrics] =
    useState({
      totalUsers: 0,
      totalDatasets: 0,
      totalReports: 0,
      totalAIRequests: 0,
    });

  const [search, setSearch] =
  useState("");

const [roleFilter, setRoleFilter] =
  useState("ALL");

const [statusFilter, setStatusFilter] =
  useState("ALL");

  useEffect(() => {
    async function loadUsers() {
      try {
        const [
          usersData,
          metricsData,
        ] = await Promise.all([
          getAdminUsers(),
          getAdminMetrics(),
        ]);

        setUsers(usersData.users);
        setMetrics(metricsData);
      } catch (error) {
        console.error(
          "Failed to load admin dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);


  const refreshUsers = async () => {

  const data = await getAdminUsers();

  setUsers(data.users);

};


const handleRoleChange = async (
  id: string,
  currentRole: string
) => {

  try {

    await changeUserRole(

      id,

      currentRole === "ADMIN"
        ? "USER"
        : "ADMIN"

    );

    await refreshUsers();

  } catch (error) {

    console.error(error);

  }

};


const handleStatusToggle = async (
  id: string
) => {

  try {

    await toggleUserStatus(id);

    await refreshUsers();

  } catch (error) {

    console.error(error);

  }

};


const handleDelete = async (
  id: string
) => {

  if (
    !window.confirm(
      "Delete this user?"
    )
  ) {
    return;
  }

  try {

    await deleteUser(id);

    await refreshUsers();

    setMetrics((prev) => ({
      ...prev,
      totalUsers: prev.totalUsers - 1,
    }));

  } catch (error) {

    console.error(error);

  }

};

const filteredUsers = users.filter((user) => {

  const matchesSearch =

    user.fullName
      .toLowerCase()
      .includes(search.toLowerCase()) ||

    user.username
      .toLowerCase()
      .includes(search.toLowerCase()) ||

    user.email
      .toLowerCase()
      .includes(search.toLowerCase());

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


  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Diralis Admin Control Center 🧠⚙️
      </h1>

      <p className="mt-2 text-slate-400">
        Monitor and manage your AI decision intelligence platform.
      </p>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row">

  <input
    type="text"
    placeholder="Search users..."
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    className="
      flex-1
      rounded-xl
      border
      border-slate-700
      bg-slate-900
      px-4
      py-3
      outline-none
      focus:border-cyan-500
    "
  />

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
  </select>

</div>

      {/* KPI Cards */}
      <div
        className="
          mt-8
          grid
          grid-cols-1
          gap-6
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        <AdminMetricCard
          title="Users"
          value={metrics.totalUsers}
          icon={<Users size={30} />}
        />

        <AdminMetricCard
          title="Datasets"
          value={metrics.totalDatasets}
          icon={<Database size={30} />}
        />

        <AdminMetricCard
          title="Reports"
          value={metrics.totalReports}
          icon={<FileText size={30} />}
        />

        <AdminMetricCard
          title="AI Requests"
          value={metrics.totalAIRequests}
          icon={<Bot size={30} />}
        />
      </div>

      {/* Platform Users */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">
          Platform Users
        </h2>

        {loading ? (
          <p className="mt-4 text-slate-400">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-slate-400">
            No users found.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="
                  rounded-xl
                  border
                  border-slate-700
                  p-4
                  transition
                  hover:border-cyan-500/40
                "
              >
                <div className="font-semibold">
                  {user.fullName}
                </div>

                <div className="text-sm text-slate-400">
                  @{user.username}
                </div>

                <div className="text-sm">
                  {user.email}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">

             <span
             className="
               rounded-full
              bg-cyan-500/20
              px-3
              py-1
              text-xs
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
           user.status === "ACTIVE"

           ? "bg-green-500/20 text-green-400"

          : "bg-red-500/20 text-red-400"
        }
       `}
       >
         {user.status}
        </span>

          </div>
       
       {/* Button */}

   {currentUser?.id === user.id ? (

  <div className="mt-4">

    <span
      className="
        inline-flex
        items-center
        rounded-lg
        bg-blue-500/20
        px-4
        py-2
        text-sm
        font-medium
        text-blue-400
      "
    >
      🛡 Current Administrator
    </span>

  </div>

) : (

  <div className="mt-4 flex flex-wrap gap-2">

    <button
      onClick={() =>
        handleRoleChange(
          user.id,
          user.role
        )
      }
      className="
        rounded-lg
        bg-cyan-600
        px-3
        py-2
        text-xs
        font-medium
        hover:bg-cyan-500
      "
    >
      {user.role === "ADMIN"
        ? "Demote"
        : "Promote"}
    </button>

    <button
      onClick={() =>
        handleStatusToggle(user.id)
      }
      className="
        rounded-lg
        bg-yellow-600
        px-3
        py-2
        text-xs
        font-medium
        hover:bg-yellow-500
      "
    >
      {user.status === "ACTIVE"
        ? "Suspend"
        : "Activate"}
    </button>

    <button
      onClick={() =>
        handleDelete(user.id)
      }
      className="
        rounded-lg
        bg-red-600
        px-3
        py-2
        text-xs
        font-medium
        hover:bg-red-500
      "
    >
      Delete
    </button>

  </div>

)}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

