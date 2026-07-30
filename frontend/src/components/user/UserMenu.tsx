import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import UserAvatar from "./UserAvatar";

export default function UserMenu() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton
  className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-slate-800"
>

        <UserAvatar />

        <div className="hidden text-left md:block">
          <p className="font-semibold">
            {user?.fullName}
          </p>

          <p className="text-xs text-slate-400">
            {user?.email}
          </p>
        </div>

        <ChevronDown size={18} />

      </MenuButton>

      <MenuItems
        anchor="bottom end"
        className="mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl focus:outline-none"
      >
        <div className="flex items-center gap-3 border-b border-slate-700 p-4">

  <UserAvatar size={48} />

  <div>
    <p className="font-semibold text-white">
      {user?.fullName}
    </p>

    <p className="text-sm text-slate-400">
      {user?.email}
    </p>
  </div>

</div>

        <MenuItem>
  {({ focus }) => (
    <button
      onClick={() => navigate("/profile")}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors duration-150 ${
        focus ? "bg-slate-800" : ""
      }`}
    >
      <User size={18} />
      <span>My Profile</span>
    </button>
  )}
</MenuItem>

        <MenuItem>
          {({ focus }) => (
            <button
              onClick={() => navigate("/settings")}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 ${
                focus ? "bg-slate-800" : ""
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
          )}
        </MenuItem>

        <div className="my-2 border-t border-slate-700" />

        <MenuItem>
          {({ focus }) => (
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-400 ${
                focus ? "bg-red-500/10" : ""
              }`}
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}

