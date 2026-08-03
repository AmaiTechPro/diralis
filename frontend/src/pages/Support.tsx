import { Link } from "react-router-dom";
import {
  HelpCircle,
  Database,
  Brain,
  UserCog,
  Mail,
} from "lucide-react";

export default function Support() {
  const supportAreas = [
    {
      icon: UserCog,
      title: "Account Support",
      description:
        "Get help with registration, authentication, profile settings, and managing your Diralis account.",
    },
    {
      icon: Database,
      title: "Data & Upload Support",
      description:
        "Need help uploading datasets, preparing CSV or Excel files, or understanding your business data requirements?",
    },
    {
      icon: Brain,
      title: "AI & Insights Support",
      description:
        "Learn how Diralis analyzes your data, generates insights, creates forecasts, and provides recommendations.",
    },
    {
      icon: HelpCircle,
      title: "Platform Assistance",
      description:
        "Get guidance on dashboards, reports, analytics features, and using Diralis effectively.",
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
            Diralis Support
          </h1>


          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            We are here to help you get the most value from your
            AI-powered Decision Intelligence Platform.
          </p>

        </div>


        <div className="mt-12 grid gap-6 md:grid-cols-2">

          {supportAreas.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>


                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  {item.title}
                </h2>


                <p className="mt-3 text-slate-600">
                  {item.description}
                </p>

              </div>
            );
          })}

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            How We Can Help
          </h2>


          <div className="mt-6 space-y-5 text-slate-600">

            <div>
              <h3 className="font-semibold text-slate-900">
                Before Uploading Data
              </h3>

              <p className="mt-1">
                Ensure your business files contain clean and structured data
                such as sales, inventory, finance, or operational records.
              </p>
            </div>


            <div>
              <h3 className="font-semibold text-slate-900">
                During Analysis
              </h3>

              <p className="mt-1">
                Diralis processes your information and converts raw business
                records into insights, forecasts, and recommendations.
              </p>
            </div>


            <div>
              <h3 className="font-semibold text-slate-900">
                Need Assistance?
              </h3>

              <p className="mt-1">
                Our support team can assist with technical issues, account
                questions, and platform guidance.
              </p>
            </div>

          </div>

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 text-center shadow-sm">

          <Mail className="mx-auto h-10 w-10 text-blue-600" />


          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            Contact Diralis Support
          </h2>


          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Have a question or need help with the platform?
            Reach out and our team will assist you.
          </p>


          <a
            href="mailto:team.diralis@gmail.com"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Email Support
          </a>

        </div>


      </div>
    </div>
  );
}

