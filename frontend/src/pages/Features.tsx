import { Link } from "react-router-dom";
import {
  Upload,
  Brain,
  BarChart3,
  TrendingUp,
  Lightbulb,
  FileText,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Upload,
      title: "Business Data Upload",
      description:
        "Upload CSV and Excel files containing sales, inventory, finance, and operational data. Diralis transforms raw business data into structured intelligence.",
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description:
        "Diralis analyzes your business data to identify trends, anomalies, patterns, and important signals hidden inside your operations.",
    },
    {
      icon: BarChart3,
      title: "Intelligent Dashboards",
      description:
        "Monitor revenue, sales performance, expenses, inventory, and key business metrics through interactive dashboards.",
    },
    {
      icon: TrendingUp,
      title: "Predictive Forecasting",
      description:
        "Forecast future sales, revenue, and inventory demand to help businesses prepare ahead instead of reacting late.",
    },
    {
      icon: Lightbulb,
      title: "AI Recommendations",
      description:
        "Move beyond dashboards. Diralis explains what happened, why it happened, and what actions your business should take next.",
    },
    {
      icon: FileText,
      title: "Business Reports",
      description:
        "Generate structured reports containing insights, summaries, and recommendations for faster decision-making.",
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
            Powerful Features for Smarter Decisions
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Diralis transforms business data into actionable intelligence,
            helping organizations understand performance, predict outcomes,
            and make confident decisions.
          </p>
        </div>


        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>


                <h2 className="text-xl font-semibold text-slate-900">
                  {feature.title}
                </h2>


                <p className="mt-3 text-slate-600">
                  {feature.description}
                </p>

              </div>
            );
          })}

        </div>


        <div className="mt-16 rounded-2xl bg-white p-8 text-center shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            From Data to Decisions
          </h2>

          <p className="mx-auto mt-3 max-w-3xl text-slate-600">
            Traditional analytics tells you what happened.
            Diralis goes further by helping businesses understand why it
            happened, what may happen next, and what actions to take.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
                What happened?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Performance analysis
              </p>
            </div>


            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
                Why did it happen?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                AI explanations
              </p>
            </div>


            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
                What will happen?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Predictive insights
              </p>
            </div>


            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
                What next?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                AI recommendations
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

