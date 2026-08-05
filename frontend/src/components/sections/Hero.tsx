import { useNavigate } from "react-router-dom";
import KpiCard from "../ui/KpiCard";
import { motion } from "framer-motion";
import FadeIn from "../ui/FadeIn";
import RevenueChart from "../dashboard/RevenueChart";
import LiveStatus from "../ui/LiveStatus";
import AIRecommendation from "../dashboard/AIRecommendation";
import useLiveMetrics from "../../hooks/useLiveMetrics";

import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TriangleAlert,
  Users,
  Gauge,
} from "../ui/icons";


export default function Hero() {

  const navigate = useNavigate();


  // Public homepage demo intelligence
  // This is not connected to user datasets.
  const demoMetrics = {
    revenueForecast: 18,
    customerGrowth: 24381,
    operationalEfficiency: 91,
    aiConfidence: 97,
    inventoryRisk: 12,
  };


  const metrics = useLiveMetrics({

    revenue: demoMetrics.revenueForecast,

    customers: demoMetrics.customerGrowth,

    efficiency: demoMetrics.operationalEfficiency,

    confidence: demoMetrics.aiConfidence,

  });



  return (

    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-20">


      <div className="absolute inset-0 -z-10">

        <div className="absolute left-1/2 top-20 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute right-0 top-0 h-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />

      </div>



      <div className="mx-auto grid max-w-7xl items-center gap-14 md:gap-16 lg:grid-cols-2">



        <FadeIn>

          <div className="flex flex-col justify-center">


            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 shadow-lg shadow-cyan-500/10">

              <Sparkles size={16} />

              Powered by AI Decision Intelligence

            </div>



            <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-7xl">

              Stop Guessing.

              <br />

              Start

              <span className="text-cyan-400">

                Growing Smarter.

              </span>

            </h1>



            <p className="mt-8 max-w-lg text-lg leading-8 text-slate-400 lg:max-w-xl">

              Diralis transforms spreadsheets, operational metrics,

              sales reports, and inventory data into AI-powered

              recommendations, predictive forecasts, and actionable

              business insights—helping you make confident decisions

              in minutes.

            </p>



            <div className="mt-10 flex flex-col gap-4 sm:flex-row">


              <motion.button

                whileHover={{
                  scale: 1.05,
                  y: -3,
                }}

                whileTap={{
                  scale: 0.97,
                }}

                onClick={() => navigate("/register")}

                className="rounded-xl bg-cyan-500 px-8 py-4 font-semibold text-slate-950 shadow-lg shadow-cyan-500/30"

              >

                Get Started

              </motion.button>



              <motion.button

                whileHover={{
                  scale: 1.05,
                }}

                whileTap={{
                  scale: 0.97,
                }}

                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 transition hover:border-cyan-400 hover:bg-slate-800"

              >

                Watch Demo

                <ArrowRight size={18} />

              </motion.button>


            </div>



            <p className="mt-8 text-sm text-slate-500">

              Built for startups, SMEs, retailers, and operations teams.

            </p>



            <div className="mt-8 flex flex-wrap gap-5 text-sm">


              {[
                "AI Recommendations",
                "Forecasting",
                "CSV Uploads",
                "Business Insights",
              ].map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-2 text-slate-300"
                >

                  <CheckCircle2 size={18} className="text-cyan-400" />

                  {item}

                </div>

              ))}


            </div>


          </div>


        </FadeIn>





        <FadeIn delay={0.25}>


          <div className="flex items-center justify-center">


            <motion.div

              animate={{
                y: [0, -8, 0],
              }}

              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut",
              }}

              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl transition hover:border-cyan-500"

            >


              <div className="space-y-5">


                <LiveStatus />



                <KpiCard

                  title="Revenue Forecast"

                  value={metrics.revenue}

                  prefix="+"

                  suffix="%"

                  icon={<TrendingUp size={20}/>}

                  color="text-green-400"

                  delay={0}

                />



                <KpiCard

                  title="Inventory Risk"

                  value={demoMetrics.inventoryRisk}

                  icon={<TriangleAlert size={20}/>}

                  color="text-yellow-400"

                  delay={0.1}

                />



                <KpiCard

                  title="Active Customers"

                  value={metrics.customers}

                  icon={<Users size={20}/>}

                  color="text-cyan-400"

                  delay={0.2}

                />



                <KpiCard

                  title="Operational Efficiency"

                  value={metrics.efficiency}

                  suffix="%"

                  icon={<Gauge size={20}/>}

                  color="text-green-400"

                  delay={0.3}

                />



                <AIRecommendation
                  confidence={metrics.confidence}
                />



                <RevenueChart

                  revenueHistory={metrics.revenueHistory}

                />


              </div>


            </motion.div>


          </div>


        </FadeIn>



      </div>


    </section>

  );

}