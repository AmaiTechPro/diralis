import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Sparkles,
  Rocket,
  Building2,
} from "lucide-react";

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      icon: Sparkles,
      name: "Starter",
      description:
        "Perfect for individuals and small teams exploring AI-powered business insights.",
      monthlyPrice: "$19",
      yearlyPrice: "$15",
      features: [
        "CSV Data Uploads",
        "Basic Analytics",
        "AI Recommendations",
        "Email Support",
      ],
      button: "Start Free Trial",
      popular: false,
    },
    {
      icon: Rocket,
      name: "Professional",
      description:
        "Advanced intelligence tools for growing businesses.",
      monthlyPrice: "$49",
      yearlyPrice: "$39",
      features: [
        "Everything in Starter",
        "Advanced Forecasting",
        "Live Dashboard",
        "Priority Support",
      ],
      button: "Start Free Trial",
      popular: true,
    },
    {
      icon: Building2,
      name: "Enterprise",
      description:
        "Custom solutions for organizations requiring scalable intelligence.",
      monthlyPrice: "Custom",
      yearlyPrice: "Custom",
      features: [
        "Custom AI Models",
        "API Access",
        "Dedicated Support",
        "Advanced Security",
      ],
      button: "Contact Sales",
      popular: false,
    },
  ];


  const comparison = [
    {
      feature: "CSV Data Uploads",
      starter: true,
      professional: true,
      enterprise: true,
    },
    {
      feature: "AI Recommendations",
      starter: true,
      professional: true,
      enterprise: true,
    },
    {
      feature: "Advanced Forecasting",
      starter: false,
      professional: true,
      enterprise: true,
    },
    {
      feature: "Live Analytics Dashboard",
      starter: false,
      professional: true,
      enterprise: true,
    },
    {
      feature: "API Access",
      starter: false,
      professional: false,
      enterprise: true,
    },
    {
      feature: "Custom AI Models",
      starter: false,
      professional: false,
      enterprise: true,
    },
    {
      feature: "Dedicated Support",
      starter: false,
      professional: false,
      enterprise: true,
    },
  ];


  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">

      <div className="mx-auto max-w-6xl">

        <Link
          to="/"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Diralis
        </Link>


        <div className="mt-8 text-center">

          <h1 className="text-4xl font-bold text-slate-900">
            Simple Pricing That Scales With You
          </h1>


          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Choose a plan that fits your business intelligence needs.
            Upgrade as your organization grows.
          </p>


          <div className="mt-6 inline-flex rounded-xl bg-white p-1 shadow-sm">

            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-lg px-5 py-2 ${
                billing === "monthly"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Monthly
            </button>


            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-lg px-5 py-2 ${
                billing === "yearly"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Yearly Save 20%
            </button>

          </div>

        </div>


        <div className="mt-12 grid gap-6 lg:grid-cols-3">

          {plans.map((plan) => {

            const Icon = plan.icon;

            return (

              <div
                key={plan.name}
                className={`rounded-2xl bg-white p-8 shadow-sm ${
                  plan.popular
                    ? "ring-2 ring-blue-600"
                    : ""
                }`}
              >

                {plan.popular && (
                  <div className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    Most Popular
                  </div>
                )}


                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>


                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  {plan.name}
                </h2>


                <p className="mt-3 text-slate-600">
                  {plan.description}
                </p>


                <div className="mt-6">

                  <span className="text-4xl font-bold text-slate-900">
                    {billing === "monthly"
                      ? plan.monthlyPrice
                      : plan.yearlyPrice}
                  </span>


                  {plan.name !== "Enterprise" && (
                    <span className="text-slate-600">
                      /month
                    </span>
                  )}

                </div>


                <button
                  className={`mt-6 w-full rounded-xl px-5 py-3 font-medium ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {plan.button}
                </button>


                <div className="mt-8 space-y-3">

                  {plan.features.map((feature) => (

                    <div
                      key={feature}
                      className="flex gap-3 text-slate-700"
                    >

                      <Check className="h-5 w-5 text-blue-600" />

                      {feature}

                    </div>

                  ))}

                </div>


              </div>

            );
          })}

        </div>


        <div className="mt-16 rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-center text-2xl font-bold text-slate-900">
            Compare Plans
          </h2>


          <p className="mt-3 text-center text-slate-600">
            Choose the intelligence level your business needs.
          </p>


          <div className="mt-8 overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b">

                  <th className="p-4">
                    Feature
                  </th>

                  <th className="p-4">
                    Starter
                  </th>

                  <th className="p-4">
                    Professional
                  </th>

                  <th className="p-4">
                    Enterprise
                  </th>

                </tr>
              </thead>


              <tbody>

                {comparison.map((item)=>(

                  <tr
                    key={item.feature}
                    className="border-b"
                  >

                    <td className="p-4 font-medium">
                      {item.feature}
                    </td>


                    <td className="p-4">
                      {item.starter ? "✓" : "—"}
                    </td>


                    <td className="p-4">
                      {item.professional ? "✓" : "—"}
                    </td>


                    <td className="p-4">
                      {item.enterprise ? "✓" : "—"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>


      </div>

    </div>
  );
}

