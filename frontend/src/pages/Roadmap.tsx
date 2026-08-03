import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Rocket,
  Brain,
  Bot,
} from "lucide-react";

export default function Roadmap() {
  const phases = [
    {
      icon: CheckCircle2,
      phase: "Phase 1",
      title: "AI Decision Intelligence Platform",
      status: "Completed",
      description:
        "Building the foundation of Diralis by helping businesses transform operational data into actionable intelligence.",
      features: [
        "User authentication",
        "CSV and Excel data upload",
        "Business dashboards",
        "AI-powered insights",
        "Recommendation engine",
        "Forecasting capabilities",
        "Reports and analytics",
      ],
    },
    {
      icon: Rocket,
      phase: "Phase 2",
      title: "Business Intelligence Expansion",
      status: "In Progress",
      description:
        "Expanding Diralis into a complete intelligence platform for growing organizations.",
      features: [
        "Multi-user organizations",
        "Scheduled business reports",
        "Advanced analytics",
        "External integrations",
        "Collaboration features",
        "Improved forecasting models",
      ],
    },
    {
      icon: Brain,
      phase: "Phase 3",
      title: "AI Business Copilot",
      status: "Planned",
      description:
        "Moving from analytics to conversational business intelligence where users can ask questions and receive strategic guidance.",
      features: [
        "Chat with your business data",
        "Voice assistant capabilities",
        "Executive summaries",
        "Natural language analysis",
        "Strategic recommendations",
      ],
    },
    {
      icon: Bot,
      phase: "Future Vision",
      title: "Autonomous Business Operating System",
      status: "Long Term",
      description:
        "The future of Diralis is an intelligent business layer that continuously monitors operations and recommends the next best actions.",
      features: [
        "Workflow automation",
        "Predictive business planning",
        "ERP integrations",
        "Accounting integrations",
        "Autonomous decision support",
      ],
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
            Diralis Roadmap
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Our journey is to become the trusted intelligence layer behind
            every business decision — from analytics today to autonomous
            business intelligence tomorrow.
          </p>

        </div>


        <div className="mt-12 space-y-6">

          {phases.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.phase}
                className="rounded-2xl bg-white p-8 shadow-sm"
              >

                <div className="flex flex-col gap-6 md:flex-row">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>


                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-2xl font-bold text-slate-900">
                        {item.phase}: {item.title}
                      </h2>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                        {item.status}
                      </span>

                    </div>


                    <p className="mt-3 text-slate-600">
                      {item.description}
                    </p>


                    <div className="mt-5 grid gap-3 md:grid-cols-2">

                      {item.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 text-slate-700"
                        >
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />

                          <span>
                            {feature}
                          </span>

                        </div>
                      ))}

                    </div>

                  </div>

                </div>

              </div>
            );
          })}

        </div>


      </div>
    </div>
  );
}

