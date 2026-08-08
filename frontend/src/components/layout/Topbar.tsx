import { Bell, Search, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

import UserMenu from "../user/UserMenu";


interface TopbarProps {
  onMenuClick: () => void;
}



const navItems = [

  {
    name: "Dashboard",
    path: "/dashboard",
  },

  {
    name: "Datasets",
    path: "/datasets",
  },

  {
    name: "AI Insights",
    path: "/ai-insights",
  },

  {
    name: "AI Chat",
    path: "/chat",
  },

  {
    name: "Reports",
    path: "/reports",
  },

  {
  name: "Billing",
  path: "/billing",
},

];




export default function Topbar({
  onMenuClick,
}: TopbarProps) {


  return (

    <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-8">



      {/* Brand + Navigation */}


      <div className="flex items-center gap-6">



        {/* Sidebar Toggle */}


        <button

          onClick={onMenuClick}

          className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"

        >

          <Menu size={24}/>

        </button>





        <div className="text-xl font-bold text-cyan-400">

          DIRALIS

        </div>





        <nav className="hidden lg:flex items-center gap-2">


          {
            navItems.map(item => (


              <NavLink

                key={item.path}

                to={item.path}

                className={({isActive}) =>


                  `rounded-lg px-4 py-2 text-sm transition-all duration-300 ${
                    
                    isActive

                    ? "bg-cyan-500/15 text-cyan-400 shadow-sm"

                    : "text-slate-300 hover:bg-slate-800 hover:text-white"

                  }`

                }

              >

                {item.name}


              </NavLink>


            ))
          }


        </nav>



      </div>






      {/* Right Side */}


      <div className="flex items-center gap-6">



        <div className="hidden md:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">


          <Search size={18}/>


          <input

            placeholder="Search..."

            className="w-40 bg-transparent outline-none"

          />


        </div>





        <button

          className="rounded-full p-2 transition hover:bg-slate-800"

        >

          <Bell size={20}/>


        </button>





        <UserMenu />


      </div>



    </header>

  );

}

