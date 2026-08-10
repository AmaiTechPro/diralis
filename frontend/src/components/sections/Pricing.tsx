import { motion } from "framer-motion";
import { useState } from "react";

const plans = [
  {
    name: "Free",

    description:
      "Get started with essential AI-powered business insights.",

    monthly: 0,

    yearly: 0,

    features: [
      "CSV Data Uploads",
      "Basic Analytics",
      "AI Recommendations",
      "Email Support",
    ],

    popular: false,
  },

  {
    name: "Starter",

    description:
      "Perfect for individuals and small teams exploring AI insights.",

    monthly: 15,

    yearly: 144,

    features: [
      "CSV Data Uploads",
      "Basic Analytics",
      "AI Recommendations",
      "Email Support",
    ],

    popular: false,
  },

  {
    name: "Pro",

    description:
      "Advanced intelligence tools for growing businesses.",

    monthly: 39,

    yearly: 390,

    features: [
      "Everything in Starter",
      "Advanced Forecasting",
      "Live Dashboard",
      "Priority Support",
    ],

    popular: true,
  },

  {
    name: "Business",

    description:
      "Powerful intelligence tools for established businesses.",

    monthly: 99,

    yearly: 990,

    features: [
      "Everything in Pro",
      "Advanced Analytics",
      "AI Agent",
      "Priority Support",
    ],

    popular: false,
  },

  {
    name: "Custom",

    description:
      "Custom solutions for organizations with specialized requirements.",

    monthly: null,

    yearly: null,

    features: [
      "Custom AI Models",
      "API Access",
      "Dedicated Support",
      "Advanced Security",
    ],

    popular: false,
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
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
      {/* Billing Toggle */}

      <div className="inline-flex items-center rounded-full">
        <button
          onClick={() => setBilling("monthly")}
          className={`
            rounded-full px-5 py-2 text-sm transition
            ${
              billing === "monthly"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400"
            }
          `}
        >
          Monthly
        </button>

        <button
          onClick={() => setBilling("yearly")}
          className={`
            rounded-full px-5 py-2 text-sm transition
            ${
              billing === "yearly"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400"
            }
          `}
        >
          Yearly
        </button>
      </div>

      {/* Pricing Cards */}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: index * 0.15,
            }}
            whileHover={{
              y: -10,
              scale: 1.02,
            }}
            className={`
              relative
              rounded-3xl
              border
              p-8
              backdrop-blur

              ${
                plan.popular
                  ? "border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/20"
                  : "border-slate-800 bg-slate-900/70"
              }
            `}
          >
            {/* Most Popular */}

            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-4 py-1 text-xs font-semibold text-slate-950">
                Most Popular
              </div>
            )}

            {/* Plan Name */}

            <h3 className="text-2xl font-bold text-white">
              {plan.name}
            </h3>

            {/* Description */}

            <p className="mt-3 min-h-[72px] text-sm text-slate-400">
              {plan.description}
            </p>

            {/* Price */}

            {plan.monthly !== null ? (
              <motion.h4
                key={`${plan.name}-${billing}`}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="mt-6 text-4xl font-bold text-white"
              >
                $
                {billing === "monthly"
                  ? plan.monthly
                  : plan.yearly}

                <span className="ml-1 text-sm font-normal text-slate-400">
                  /{billing === "monthly" ? "month" : "year"}
                </span>
              </motion.h4>
            ) : (
              <motion.h4
                key={`${plan.name}-${billing}`}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="mt-6 text-3xl font-bold text-white"
              >
                Contact Sales
              </motion.h4>
            )}

            {/* Features */}

            <ul className="mt-8 space-y-3 text-left">
              {plan.features.map(
                (feature, featureIndex) => (
                  <motion.li
                    key={feature}
                    initial={{
                      opacity: 0,
                      x: -10,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      duration: 0.3,
                      delay:
                        featureIndex * 0.08,
                    }}
                    className="flex items-center gap-2 text-sm text-slate-300"
                  >
                    <span className="text-cyan-400">
                      ✓
                    </span>

                    {feature}
                  </motion.li>
                )
              )}
            </ul>

            {/* CTA */}

            <motion.button
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="
                mt-8
                w-full
                rounded-xl
                bg-cyan-500
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >
              {plan.name === "Custom"
                ? "Contact Sales"
                : "Start Free Trial"}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
