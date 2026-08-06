import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";


import {
getAdminUsers,
getAdminMetrics,
changeUserRole,
toggleUserStatus,
deleteUser,
getSecurityEvents,
getLockedAccounts,
} from "../services/adminService";

import {
  Users,
  Database,
  ShieldAlert,
  UserCheck,
  Lock,
  Activity,
} from "lucide-react";


import AdminMetricCard from "../components/admin/AdminMetricCard";

interface User {

id:string;

fullName:string;

username:string;

email:string;

role:string;

status:string;

provider:string;

createdAt:string;

emailVerified:boolean;

failedLoginAttempts:number;

lockedUntil:string | null;

lastLogin:string | null;

picture:string | null;

}

export default function AdminDashboard() {

  const { user: currentUser } = useAuth();

  const [users, setUsers] =
    useState<User[]>([]);

  const [securityEvents,setSecurityEvents] =
useState<any[]>([]);


const [lockedAccounts,setLockedAccounts] =
useState<any[]>([]);


  const [loading, setLoading] =
    useState(true);

  const [metrics, setMetrics] = useState({
  totalUsers: 0,
  verifiedUsers: 0,
  totalDatasets: 0,
  securityEvents: 0,
  lockedAccounts: 0,
  activeSessions: 0,
  chatSessions: 0,
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
xl:grid-cols-6
"
>

<AdminMetricCard
title="Users"
value={metrics.totalUsers}
icon={<Users size={30}/>}
/>

<AdminMetricCard
title="Verified"
value={metrics.verifiedUsers}
icon={<UserCheck size={30}/>}
/>

<AdminMetricCard
title="Datasets"
value={metrics.totalDatasets}
icon={<Database size={30}/>}
/>

<AdminMetricCard
title="Security Events"
value={metrics.securityEvents}
icon={<ShieldAlert size={30}/>}
/>

<AdminMetricCard
title="Locked Accounts"
value={metrics.lockedAccounts}
icon={<Lock size={30}/>}
/>

<AdminMetricCard
title="Active Sessions"
value={metrics.activeSessions}
icon={<Activity size={30}/>}

/>

</div>



      {/* Security Events UI */}

      <div className="
mt-8
rounded-2xl
border
border-slate-800
bg-slate-900
p-6
">

<h2 className="text-xl font-semibold">
Security Events
</h2>


<div className="mt-5 space-y-3">

{securityEvents.length === 0 ? (

<p className="text-slate-400">
No security events yet.
</p>

) : (

securityEvents.map((event)=>(
<div
key={event.id}
className="
rounded-xl
border
border-slate-700
p-4
"
>

<div className="font-medium">
{event.action}
</div>


<div className="text-sm text-slate-400">

{event.user?.username || "Unknown user"}

</div>


<div className="text-xs text-slate-500">

{new Date(
event.createdAt
).toLocaleString()}

</div>


</div>
))

)}

</div>

</div>


   {/* Locked Account Panel */}

   <div className="
mt-8
rounded-2xl
border
border-red-900
bg-slate-900
p-6
">

<h2 className="text-xl font-semibold">
Locked Accounts
</h2>


<div className="mt-5 space-y-3">

{
lockedAccounts.length === 0 ?

<p className="text-slate-400">
No locked accounts.
</p>

:

lockedAccounts.map((user)=>(
<div
key={user.id}
className="
rounded-xl
border
border-slate-700
p-4
"
>

<div className="font-semibold">
@{user.username}
</div>


<div className="text-sm text-slate-400">

Failed attempts:
{user.failedLoginAttempts}

</div>


<div className="text-sm text-red-400">

Locked until:

{new Date(
user.lockedUntil
).toLocaleString()}

</div>


</div>
))

}

</div>

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

