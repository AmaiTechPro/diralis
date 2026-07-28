import { motion } from "framer-motion";

const metrics = [
  {
    value: "10K+",
    label: "Business Data Points Analyzed",
    description: "AI-powered insights generated from operational data.",
  },

  {
    value: "98.7%",
    label: "Prediction Accuracy",
    description: "Reliable forecasts for smarter decisions.",
  },

  {
    value: "40%",
    label: "Faster Decision Making",
    description: "Reduce analysis time with automated intelligence.",
  },

  {
    value: "24/7",
    label: "AI Monitoring",
    description: "Continuous business performance tracking.",
  },
];


export default function Metrics() {

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

          transition={{
            duration:0.6,
          }}

          className="text-center"

        >

          <p className="text-sm uppercase tracking-widest text-cyan-400">
            Business Impact
          </p>


          <h2 className="mt-4 text-3xl font-bold text-white">
            Turning data into measurable results
          </h2>


          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Diralis transforms complex operational data into
            actionable intelligence that helps teams grow faster.
          </p>


        </motion.div>



        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">


          {metrics.map((metric,index)=>(


            <motion.div

              key={metric.label}

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
                duration:0.5,
                delay:index * 0.1,
              }}


              whileHover={{
                y:-6,
                scale:1.02,
              }}


              className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900/70
              p-6
              text-center
              backdrop-blur
              transition
              hover:border-cyan-500/40
              "

            >


              <h3 className="text-4xl font-extrabold text-cyan-400">

                {metric.value}

              </h3>


              <p className="mt-4 font-semibold text-white">

                {metric.label}

              </p>


              <p className="mt-2 text-sm text-slate-400">

                {metric.description}

              </p>


            </motion.div>


          ))}


        </div>


      </div>


    </section>

  );
}


