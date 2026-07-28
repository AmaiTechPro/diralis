import { motion } from "framer-motion";


const features = [
  {
    name: "CSV Data Uploads",
    starter: true,
    professional: true,
    enterprise: true,
  },

  {
    name: "AI Recommendations",
    starter: true,
    professional: true,
    enterprise: true,
  },

  {
    name: "Advanced Forecasting",
    starter: false,
    professional: true,
    enterprise: true,
  },

  {
    name: "Live Analytics Dashboard",
    starter: false,
    professional: true,
    enterprise: true,
  },

  {
    name: "API Access",
    starter: false,
    professional: false,
    enterprise: true,
  },

  {
    name: "Custom AI Models",
    starter: false,
    professional: false,
    enterprise: true,
  },

  {
    name: "Dedicated Support",
    starter: false,
    professional: false,
    enterprise: true,
  },
];


function Check({
  enabled,
}: {
  enabled:boolean;
}) {

  return (
    <span
      className={
        enabled
        ?
        "text-cyan-400 text-xl"
        :
        "text-slate-600 text-xl"
      }
    >
      {enabled ? "✓" : "—"}
    </span>
  );
}



export default function FeatureComparison(){

  return (

    <section className="px-6 py-20">


      <div className="mx-auto max-w-7xl">


        <motion.div

          initial={{
            opacity:0,
            y:20,
          }}

          whileInView={{
            opacity:1,
            y:0,
          }}

          viewport={{
            once:true,
          }}

          className="text-center"

        >

          <p className="text-sm uppercase tracking-widest text-cyan-400">
            Compare Plans
          </p>


          <h2 className="mt-4 text-3xl font-bold text-white">
            Choose the intelligence level your business needs
          </h2>


          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Every plan gives you powerful analytics.
            Upgrade when your business grows.
          </p>


        </motion.div>



        <motion.div

          initial={{
            opacity:0,
            y:30,
          }}

          whileInView={{
            opacity:1,
            y:0,
          }}

          viewport={{
            once:true,
          }}

          transition={{
            duration:0.6,
          }}

          className="
          mt-12
          overflow-x-auto
          rounded-2xl
          border
          border-slate-800
          "

        >

          <table className="
          min-w-full
          divide-y
          divide-slate-800
          ">


            <thead className="bg-slate-900">


              <tr>

                <th className="px-6 py-5 text-left text-sm text-slate-400">
                  Feature
                </th>


                <th className="px-6 py-5 text-center text-sm text-slate-300">
                  Starter
                </th>


                <th className="px-6 py-5 text-center text-sm text-cyan-400">
                  Professional
                </th>


                <th className="px-6 py-5 text-center text-sm text-slate-300">
                  Enterprise
                </th>

              </tr>


            </thead>



            <tbody className="bg-slate-950">


            {
              features.map((feature)=>(

                <tr
                  key={feature.name}
                  className="
                  border-t
                  border-slate-800
                  hover:bg-slate-900/50
                  transition
                  "
                >

                  <td className="
                  px-6
                  py-4
                  text-sm
                  text-slate-300
                  ">
                    {feature.name}
                  </td>


                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.starter}/>
                  </td>


                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.professional}/>
                  </td>


                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.enterprise}/>
                  </td>


                </tr>

              ))
            }


            </tbody>


          </table>


        </motion.div>


      </div>


    </section>

  );
}


