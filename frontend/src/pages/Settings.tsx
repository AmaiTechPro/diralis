import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";

import {
  User,
  Bell,
  Shield,
  Palette,
} from "lucide-react";

import {
  getSettings,
  updateSettings,
  updateProfile,
  changePassword,
} from "../services/settingsService";



export default function Settings() {

  const { user } = useAuth();

  const { setTheme: applyTheme } = useTheme();


  const [theme, setTheme] = useState("dark");

  const [emailNotifications, setEmailNotifications] =
    useState(true);


  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");


  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  const [message, setMessage] =
    useState("");


  useEffect(() => {

    if (user) {

      setFullName(user.fullName);

      setEmail(user.email);

    }

  }, [user]);


  useEffect(() => {

    async function loadSettings() {

      try {

        const data = await getSettings();

        setTheme(data.theme ?? "dark");

        setEmailNotifications(
          data.emailNotifications ?? true
        );

        applyTheme(data.theme ?? "dark");

      } catch (error) {

        console.error(error);

      }

    }

    loadSettings();

  }, [applyTheme]);



  async function handleSettingsUpdate(
    updates: {
      theme?: string;
      emailNotifications?: boolean;
    }
  ) {

    try {

      const updated =
        await updateSettings({

          theme:
            updates.theme ?? theme,

          emailNotifications:
            updates.emailNotifications ??
            emailNotifications,

        });


      setTheme(updated.theme);

      setEmailNotifications(
        updated.emailNotifications
      );

      applyTheme(updated.theme);

      setMessage("Settings updated.");

    } catch {

      setMessage("Failed to update settings.");

    }

  }



  async function handleProfileSave() {

    try {

      await updateProfile({

        fullName,

        email,

      });

      setMessage("Profile updated.");

    } catch {

      setMessage("Failed to update profile.");

    }

  }



  async function handlePasswordChange() {

    if (newPassword !== confirmPassword) {

      setMessage("Passwords do not match.");

      return;

    }


    try {

      await changePassword({

        currentPassword,

        newPassword,

      });

      setCurrentPassword("");

      setNewPassword("");

      setConfirmPassword("");

      setMessage("Password updated.");

    } catch {

      setMessage("Failed to change password.");

    }

  }



  return (

    <AppLayout>

      <h1 className="text-4xl font-bold">
        Settings
      </h1>

      <p className="mt-3 text-slate-400">
        Configure your Diralis preferences.
      </p>


      {message && (

        <div className="mt-6 rounded-lg bg-cyan-500/20 border border-cyan-500 p-3 text-cyan-300">

          {message}

        </div>

      )}


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


          <div className="mt-5 space-y-4">

            <input
              value={fullName}
              onChange={(e)=>
                setFullName(e.target.value)
              }
              className="w-full rounded-lg bg-slate-800 p-3"
              placeholder="Full Name"
            />

            <input
              value={user?.username}
              readOnly
              className="w-full rounded-lg bg-slate-700 p-3 cursor-not-allowed"
            />

            <input
              value={email}
              onChange={(e)=>
                setEmail(e.target.value)
              }
              className="w-full rounded-lg bg-slate-800 p-3"
              placeholder="Email"
            />

            <button
              onClick={handleProfileSave}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-black hover:bg-cyan-400"
            >
              Save Profile
            </button>

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

            <span>
              Enable alerts
            </span>

            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e)=>
                handleSettingsUpdate({

                  emailNotifications:
                    e.target.checked,

                })
              }
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


          <div className="mt-5 space-y-3">

            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e)=>
                setCurrentPassword(e.target.value)
              }
              className="w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e)=>
                setNewPassword(e.target.value)
              }
              className="w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e)=>
                setConfirmPassword(e.target.value)
              }
              className="w-full rounded-lg bg-slate-800 p-3"
            />

            <button
              onClick={handlePasswordChange}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-black hover:bg-cyan-400"
            >
              Change Password
            </button>

          </div>

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

            value={theme}

            onChange={(e)=>{

              setTheme(e.target.value);

              applyTheme(e.target.value);

              handleSettingsUpdate({

                theme:
                  e.target.value,

              });

            }}

            className="mt-5 w-full rounded-lg bg-slate-800 p-3"

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

