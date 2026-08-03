import { Link } from "react-router-dom";
import {
  BookOpen,
  UploadCloud,
  LayoutDashboard,
  Brain,
  TrendingUp,
  FileText,
  Code2,
} from "lucide-react";

export default function Documentation() {
  const sections = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description:
        "Learn how to create your Diralis account, understand the platform, and begin your journey from business data to intelligent decisions.",
      topics: [
        "Creating an account",
        "Understanding the Diralis workflow",
        "Setting up your first workspace",
      ],
    },
    {
      icon: UploadCloud,
      title: "Data Upload Guide",
      description:
        "Prepare and upload your business datasets for analysis and intelligence generation.",
      topics: [
        "Supported file formats",
        "CSV and Excel requirements",
        "Data quality recommendations",
      ],
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard Guide",
      description:
        "Understand your business dashboard, KPIs, charts, and performance indicators.",
      topics: [
        "Revenue analytics",
        "Business metrics",
        "Interactive visualizations",
      ],
    },
    {
      icon: Brain,
      title: "AI Insights",
      description:
        "Discover how Diralis transforms operational data into explanations, patterns, and recommendations.",
      topics: [
        "Trend detection",
        "Anomaly identification",
        "Natural language insights",
      ],
    },
    {
      icon: TrendingUp,
      title: "Forecasting",
      description:
        "Learn how predictive intelligence helps businesses prepare for future opportunities and risks.",
      topics: [
        "Sales forecasting",
        "Revenue prediction",
        "Inventory planning",
      ],
    },
    {
      icon: FileText,
      title: "Reports",
      description:
        "Generate structured reports that summarize business performance and AI recommendations.",
      topics: [
        "Business summaries",
        "Export options",
        "Decision-ready reports",
      ],
    },
    {
      icon: Code2,
      title: "Developer Documentation",
      description:
        "Technical resources for future integrations, APIs, and enterprise connections.",
      topics: [
        "API references",
        "Authentication",
        "Third-party integrations",
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
            Diralis Documentation
          </h1>


          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Explore guides, resources, and technical documentation to help
            you transform business data into actionable intelligence.
          </p>

        </div>


        <div className="mt-12 grid gap-6 md:grid-cols-2">

          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <div
                key={section.title}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>


                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  {section.title}
                </h2>


                <p className="mt-3 text-slate-600">
                  {section.description}
                </p>


                <div className="mt-5 space-y-2">

                  {section.topics.map((topic) => (
                    <div
                      key={topic}
                      className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-700"
                    >
                      {topic}
                    </div>
                  ))}

                </div>

              </div>
            );
          })}

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            The Diralis Intelligence Workflow
          </h2>


          <p className="mt-3 text-slate-600">
            Everything in Diralis follows a simple intelligence pipeline:
          </p>


          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm font-medium text-slate-700 md:flex-row">

            <span className="rounded-full bg-slate-100 px-5 py-2">
              Business Data
            </span>

            <span>
              →
            </span>


            <span className="rounded-full bg-slate-100 px-5 py-2">
              AI Processing
            </span>


            <span>
              →
            </span>


            <span className="rounded-full bg-slate-100 px-5 py-2">
              Insights
            </span>


            <span>
              →
            </span>


            <span className="rounded-full bg-slate-100 px-5 py-2">
              Recommendations
            </span>


            <span>
              →
            </span>


            <span className="rounded-full bg-slate-100 px-5 py-2">
              Decisions
            </span>

          </div>

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 text-center shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Need More Help?
          </h2>


          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            If you cannot find what you need in the documentation,
            our support team is ready to assist.
          </p>


          <Link
            to="/support"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Visit Support
          </Link>

        </div>


      </div>
    </div>
  );
}

