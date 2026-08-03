import { Link } from "react-router-dom";
import {
  Target,
  Eye,
  Brain,
  Building2,
} from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description:
        "Transform operational data into trusted intelligence that helps organizations decide, adapt, and grow with confidence.",
    },
    {
      icon: Eye,
      title: "Our Vision",
      description:
        "Become the trusted intelligence layer behind every business decision.",
    },
    {
      icon: Brain,
      title: "Our Approach",
      description:
        "Diralis combines business analytics, artificial intelligence, and predictive insights to help organizations move from reactive decisions to proactive strategies.",
    },
    {
      icon: Building2,
      title: "Who We Serve",
      description:
        "We help small and medium businesses, startups, institutions, and growing organizations unlock the value hidden inside their operational data.",
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
            About Diralis
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Diralis is an AI-powered Decision Intelligence Platform built to
            help businesses transform scattered operational data into clear,
            actionable decisions.
          </p>

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Turning Data Into Decisions
          </h2>


          <p className="mt-4 leading-relaxed text-slate-600">
            Businesses generate massive amounts of data every day across
            sales, inventory, finance, customers, and operations. However,
            having data does not automatically create better decisions.
          </p>


          <p className="mt-4 leading-relaxed text-slate-600">
            Diralis bridges this gap by helping organizations understand what
            happened, why it happened, what is likely to happen next, and what
            actions should be taken.
          </p>


          <p className="mt-4 leading-relaxed text-slate-600">
            Instead of providing dashboards alone, Diralis delivers
            intelligence, explanations, predictions, and recommendations.
          </p>

        </div>


        <div className="mt-8 grid gap-6 md:grid-cols-2">

          {values.map((value) => {
            const Icon = value.icon;

            return (
              <div
                key={value.title}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>


                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {value.title}
                </h3>


                <p className="mt-3 text-slate-600">
                  {value.description}
                </p>

              </div>
            );
          })}

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 text-center shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            From Business Data to Business Intelligence
          </h2>


          <p className="mx-auto mt-3 max-w-3xl text-slate-600">
            Our goal is simple: empower organizations with intelligence that
            makes every decision faster, smarter, and more confident.
          </p>

        </div>


      </div>
    </div>
  );
}

