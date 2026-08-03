import { Link } from "react-router-dom";
import {
  Mail,
  MessageSquare,
  Users,
  Handshake,
} from "lucide-react";

export default function Contact() {
  const contactOptions = [
    {
      icon: Mail,
      title: "General Inquiries",
      description:
        "Have questions about Diralis, our platform, or how we can help your business?",
      action: "team.diralis@gmail.com",
    },
    {
      icon: MessageSquare,
      title: "Customer Support",
      description:
        "Need help with your account, datasets, dashboards, or platform features?",
      action: "team.diralis@gmail.com",
    },
    {
      icon: Users,
      title: "Business Partnerships",
      description:
        "Interested in collaborating, integrating, or bringing Diralis to your organization?",
      action: "team.diralis@gmail.com",
    },
    {
      icon: Handshake,
      title: "Enterprise Solutions",
      description:
        "Looking for customized intelligence solutions for your organization?",
      action: "team.diralis@gmail.com",
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
            Contact Diralis
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Have questions, need support, or want to explore how Diralis can
            help your organization make smarter decisions?
          </p>

        </div>


        <div className="mt-12 grid gap-6 md:grid-cols-2">

          {contactOptions.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl bg-white p-6 shadow-sm"
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


                <a
                  href={`mailto:${item.action}`}
                  className="mt-4 inline-block font-medium text-blue-600 hover:underline"
                >
                  {item.action}
                </a>

              </div>
            );
          })}

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 text-center shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Let's Build Smarter Decisions Together
          </h2>


          <p className="mx-auto mt-3 max-w-3xl text-slate-600">
            Whether you are a growing business looking to understand your
            data or an organization exploring AI-powered decision intelligence,
            our team is ready to help.
          </p>


          <a
            href="mailto:team.diralis@gmail.com"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Contact Us
          </a>

        </div>


      </div>
    </div>
  );
}

