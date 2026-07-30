import { Bell, Search } from "lucide-react";
import UserMenu from "../user/UserMenu";

export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-8">

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition-all duration-200 focus-within:border-cyan-500">
        

        <Search size={18} />

        <input
          placeholder="Search..."
          className="bg-transparent outline-none"
        />

      </div>

      <div className="flex items-center gap-6">

       <button className="rounded-full p-2 transition-all duration-200 hover:bg-slate-800">

          <Bell size={20} />
        </button>

        <UserMenu />

      </div>

    </header>
  );
}

