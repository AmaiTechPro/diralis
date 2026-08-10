import { motion } from "framer-motion";

const features = [
  {
    name: "CSV Data Uploads",
    free: true,
    starter: true,
    pro: true,
    business: true,
    custom: true,
  },

  {
    name: "AI Recommendations",
    free: true,
    starter: true,
    pro: true,
    business: true,
    custom: true,
  },

  {
    name: "Advanced Forecasting",
    free: false,
    starter: false,
    pro: true,
    business: true,
    custom: true,
  },

  {
    name: "Live Analytics Dashboard",
    free: false,
    starter: false,
    pro: true,
    business: true,
    custom: true,
  },

  {
    name: "API Access",
    free: false,
    starter: false,
    pro: false,
    business: true,
    custom: true,
  },

  {
    name: "Custom AI Models",
    free: false,
    starter: false,
    pro: false,
    business: false,
    custom: true,
  },

  {
    name: "Dedicated Support",
    free: false,
    starter: false,
    pro: false,
    business: false,
    custom: true,
  },
];

function Check({
  enabled,
}: {
  enabled: boolean;
}) {
  return (
    <span
      className={
        enabled
          ? "text-cyan-400 text-xl"
          : "text-slate-600 text-xl"
      }
    >
      {enabled ? "✓" : "—"}
    </span>
  );
}

export default function FeatureComparison() {
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
            opacity: 0,
            y: 30,
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
          className="
            mt-12
            overflow-x-auto
            rounded-2xl
            border
            border-slate-800
          "
        >

          <table className="
            min-w-[1000px]
            w-full
            divide-y
            divide-slate-800
          ">

            <thead className="bg-slate-900">

              <tr>

                <th className="px-6 py-5 text-left text-sm text-slate-400">
                  Feature
                </th>

                {/* Free */}
                <th className="px-6 py-5 text-center text-sm text-slate-300">
                  <div>Free</div>
                  <div className="mt-1 text-xs text-slate-500">
                    $0
                  </div>
                </th>

                {/* Starter */}
                <th className="px-6 py-5 text-center text-sm text-slate-300">
                  <div>Starter</div>
                  <div className="mt-1 text-xs text-slate-500">
                    $15/month
                  </div>
                </th>

                {/* Pro */}
                <th className="px-6 py-5 text-center text-sm font-semibold text-cyan-400">
                  <div>Pro</div>
                  <div className="mt-1 text-xs text-cyan-500">
                    $39/month
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-cyan-400">
                    Most Popular
                  </div>
                </th>

                {/* Business */}
                <th className="px-6 py-5 text-center text-sm text-slate-300">
                  <div>Business</div>
                  <div className="mt-1 text-xs text-slate-500">
                    $99/month
                  </div>
                </th>

                {/* Custom */}
                <th className="px-6 py-5 text-center text-sm text-slate-300">
                  <div>Custom</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Contact Sales
                  </div>
                </th>

              </tr>

            </thead>

            <tbody className="bg-slate-950">

              {features.map((feature) => (

                <tr
                  key={feature.name}
                  className="
                    border-t
                    border-slate-800
                    transition
                    hover:bg-slate-900/50
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

                  {/* Free */}
                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.free} />
                  </td>

                  {/* Starter */}
                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.starter} />
                  </td>

                  {/* Pro */}
                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.pro} />
                  </td>

                  {/* Business */}
                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.business} />
                  </td>

                  {/* Custom */}
                  <td className="px-6 py-4 text-center">
                    <Check enabled={feature.custom} />
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </motion.div>

      </div>

    </section>
  );
}
