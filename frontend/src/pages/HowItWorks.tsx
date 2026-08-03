import { Link } from "react-router-dom";
import {
  UploadCloud,
  Search,
  LayoutDashboard,
  Sparkles,
  Target,
  Rocket,
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: UploadCloud,
      title: "1. Upload Business Data",
      description:
        "Connect your operational data by uploading CSV or Excel files containing sales, inventory, finance, or business performance information.",
    },
    {
      icon: Search,
      title: "2. Diralis Analyzes Your Data",
      description:
        "The platform processes your data, identifies trends, detects anomalies, and discovers important business patterns.",
    },
    {
      icon: LayoutDashboard,
      title: "3. Intelligence Dashboard Generated",
      description:
        "Your business information is transformed into interactive dashboards showing KPIs, metrics, charts, and performance insights.",
    },
    {
      icon: Sparkles,
      title: "4. AI Generates Insights",
      description:
        "Diralis explains your data using artificial intelligence, helping you understand what happened and why it happened.",
    },
    {
      icon: Target,
      title: "5. Receive Recommendations",
      description:
        "Get actionable suggestions such as inventory adjustments, sales opportunities, and operational improvements.",
    },
    {
      icon: Rocket,
      title: "6. Make Better Decisions",
      description:
        "Turn trusted intelligence into faster decisions that help your organization adapt, optimize, and grow.",
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
            How Diralis Works
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Diralis converts raw business data into actionable intelligence
            through a simple process designed for business owners,
            managers, and decision-makers.
          </p>

        </div>


        <div className="relative mt-12 grid gap-6 md:grid-cols-2">

          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>


                  <div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      {step.title}
                    </h2>


                    <p className="mt-2 text-slate-600">
                      {step.description}
                    </p>

                  </div>

                </div>

              </div>
            );
          })}

        </div>


        <div className="mt-16 rounded-2xl bg-white p-8 text-center shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            From Data Collection to Intelligent Action
          </h2>


          <p className="mx-auto mt-3 max-w-3xl text-slate-600">
            Diralis bridges the gap between having data and making decisions.
            Instead of spending hours analyzing spreadsheets, businesses get
            clear intelligence that helps them act with confidence.
          </p>


          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm font-medium text-slate-700 md:flex-row">

            <span className="rounded-full bg-slate-100 px-5 py-2">
              Business Data
            </span>

            <span>→</span>

            <span className="rounded-full bg-slate-100 px-5 py-2">
              AI Analysis
            </span>

            <span>→</span>

            <span className="rounded-full bg-slate-100 px-5 py-2">
              Insights
            </span>

            <span>→</span>

            <span className="rounded-full bg-slate-100 px-5 py-2">
              Better Decisions
            </span>

          </div>

        </div>


      </div>
    </div>
  );
}


