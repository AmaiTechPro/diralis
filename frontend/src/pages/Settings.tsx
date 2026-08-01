import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";

import {
  User,
  Bell,
  Shield,
  Palette,
} from "lucide-react";


export default function Settings() {

  const { user } = useAuth();


  return (
    <AppLayout>

      <h1 className="text-4xl font-bold">
        Settings
      </h1>

      <p className="mt-3 text-slate-400">
        Configure your Diralis preferences.
      </p>



      <div className="mt-8 grid gap-6 md:grid-cols-2">


        {/* Account */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <User
              className="text-cyan-400"
              size={22}
            />

            <h2 className="text-xl font-semibold">
              Account
            </h2>

          </div>


          <div className="mt-5 space-y-3 text-sm">

            <p>
              <span className="text-slate-400">
                Name:
              </span>{" "}
              {user?.fullName}
            </p>


            <p>
              <span className="text-slate-400">
                Username:
              </span>{" "}
              {user?.username}
            </p>


            <p>
              <span className="text-slate-400">
                Email:
              </span>{" "}
              {user?.email}
            </p>

          </div>

        </div>




        {/* Notifications */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <Bell
              className="text-cyan-400"
              size={22}
            />

            <h2 className="text-xl font-semibold">
              Notifications
            </h2>

          </div>


          <label className="mt-5 flex items-center justify-between">

            <span className="text-slate-300">
              Enable alerts
            </span>


            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5"
            />

          </label>

        </div>





        {/* Security */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <Shield
              className="text-cyan-400"
              size={22}
            />

            <h2 className="text-xl font-semibold">
              Security
            </h2>

          </div>


          <button
            className="mt-5 rounded-lg bg-cyan-500 px-4 py-2 text-black transition hover:bg-cyan-400"
          >
            Change Password
          </button>


        </div>





        {/* Appearance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <Palette
              className="text-cyan-400"
              size={22}
            />

            <h2 className="text-xl font-semibold">
              Appearance
            </h2>

          </div>


          <select
            className="mt-5 w-full rounded-lg bg-slate-800 p-3"
            defaultValue="dark"
          >

            <option value="dark">
              Dark Mode
            </option>

            <option value="light">
              Light Mode
            </option>

          </select>


        </div>


      </div>


    </AppLayout>
  );
}

