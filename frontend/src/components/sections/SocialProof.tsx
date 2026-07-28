import { motion } from "framer-motion";

const partners = [
  "Nova Retail",
  "Vertex Labs",
  "Apex Logistics",
  "CloudMart",
  "BrightScale",
];


export default function SocialProof() {
  return (
    <section className="px-6 py-20">

      <div className="mx-auto max-w-7xl">


        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
          className="text-center"
        >

          <p className="text-sm uppercase tracking-widest text-slate-500">
            Trusted by innovative teams
          </p>


          <h2 className="mt-4 text-3xl font-bold text-white">
            Helping businesses make smarter decisions
          </h2>


          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Diralis empowers modern businesses with AI-powered
            analytics, forecasting, and operational intelligence.
          </p>

        </motion.div>



        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {partners.map((partner, index) => (

            <motion.div

              key={partner}

              initial={{
                opacity: 0,
                y: 20,
              }}

              whileInView={{
                opacity: 1,
                y: 0,
              }}

              viewport={{
                once: true,
              }}

              transition={{
                duration: 0.4,
                delay: index * 0.1,
              }}

              whileHover={{
                y: -5,
              }}

              className="
              flex
              h-20
              items-center
              justify-center
              rounded-xl
              border
              border-slate-800
              bg-slate-900/60
              text-sm
              font-semibold
              text-slate-300
              backdrop-blur
              transition
              hover:border-cyan-500/40
              "

            >

              {partner}

            </motion.div>

          ))}

        </div>


      </div>

    </section>
  );
}


