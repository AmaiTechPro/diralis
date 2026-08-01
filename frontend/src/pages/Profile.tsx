import { useEffect, useState } from "react";

import AppLayout from "../components/layout/AppLayout";

import {
  User,
  Mail,
  Calendar,
  Database,
  FileText,
  BarChart3,
} from "lucide-react";

import {
  getUserProfile,
} from "../services/profileService";


interface ProfileData {

  user: {

    fullName: string;

    username: string;

    email: string;

    provider: string;

    picture?: string | null;

    createdAt: string;

  };


  stats: {

    datasets: number;

    reports: number;

    analyses: number;

  };

}



export default function Profile() {


  const [profile,setProfile] =
    useState<ProfileData | null>(null);


  const [loading,setLoading] =
    useState(true);



  useEffect(()=>{


    async function loadProfile(){

      try {

        const data =
          await getUserProfile();


        setProfile(data);


      } catch(error){

        console.error(
          "Failed loading profile:",
          error
        );

      } finally {

        setLoading(false);

      }

    }


    loadProfile();


  },[]);




  if(loading){

    return (

      <AppLayout>

        <div className="p-8 text-slate-400">

          Loading profile...

        </div>

      </AppLayout>

    );

  }



  if(!profile){

    return (

      <AppLayout>

        <div className="p-8">

          Unable to load profile.

        </div>

      </AppLayout>

    );

  }



  return (

    <AppLayout>

      <div className="space-y-8">


        <div>

          <h1 className="text-4xl font-bold">

            Profile

          </h1>


          <p className="mt-2 text-slate-400">

            Manage your Diralis account information

          </p>

        </div>





        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">


          <div className="flex items-center gap-5">


            <div className="rounded-full bg-cyan-500/20 p-5">

              {
                profile.user.picture ?

                <img

                  src={profile.user.picture}

                  className="h-16 w-16 rounded-full"

                />

                :

                <User

                  size={40}

                  className="text-cyan-400"

                />

              }

            </div>



            <div>

              <h2 className="text-2xl font-bold">

                {profile.user.fullName}

              </h2>


              <p className="text-slate-400">

                @{profile.user.username}

              </p>


            </div>


          </div>


        </div>





        <div className="grid gap-5 md:grid-cols-3">


          <Card

            icon={<Database size={22}/>}

            title="Datasets"

            value={profile.stats.datasets}

          />


          <Card

            icon={<FileText size={22}/>}

            title="Reports"

            value={profile.stats.reports}

          />


          <Card

            icon={<BarChart3 size={22}/>}

            title="Analyses"

            value={profile.stats.analyses}

          />


        </div>





        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">


          <Info

            icon={<Mail/>}

            label="Email"

            value={profile.user.email}

          />


          <Info

            icon={<Calendar/>}

            label="Joined"

            value={
              new Date(
                profile.user.createdAt
              ).toLocaleDateString()
            }

          />


          <Info

            icon={<User/>}

            label="Provider"

            value={profile.user.provider}

          />


        </div>


      </div>


    </AppLayout>

  );

}





function Card(
{
 icon,
 title,
 value
}:any
){

return (

<div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">


<div className="flex items-center gap-3 text-cyan-400">

{icon}

<span>

{title}

</span>

</div>



<p className="mt-3 text-3xl font-bold">

{value}

</p>


</div>

);

}





function Info(
{
 icon,
 label,
 value
}:any
){

return (

<div className="flex items-center gap-4">


<div className="text-cyan-400">

{icon}

</div>


<div>

<p className="text-sm text-slate-400">

{label}

</p>


<p className="font-medium">

{value}

</p>


</div>


</div>

);

}
