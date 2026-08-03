import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Database,
  UserCheck,
  Cloud,
  AlertTriangle,
} from "lucide-react";

export default function Security() {
  const securityPractices = [
    {
      icon: ShieldCheck,
      title: "Secure Authentication",
      description:
        "Diralis protects user accounts through secure authentication mechanisms, encrypted credentials, and controlled access management.",
    },
    {
      icon: Lock,
      title: "Data Protection",
      description:
        "Business data uploaded to Diralis is handled with security-focused practices designed to protect confidentiality and integrity.",
    },
    {
      icon: UserCheck,
      title: "Role-Based Access Control",
      description:
        "Access permissions are managed according to user roles, ensuring users only access features and resources they are authorized to use.",
    },
    {
      icon: Database,
      title: "Secure Data Management",
      description:
        "Diralis follows secure database practices to maintain reliable storage, processing, and management of business information.",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure Security",
      description:
        "The platform is designed using modern cloud-native architecture principles focused on availability, scalability, and reliability.",
    },
    {
      icon: AlertTriangle,
      title: "Responsible Security Reporting",
      description:
        "We encourage responsible disclosure of security issues to help us continuously improve the safety of the Diralis platform.",
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
            Diralis Security
          </h1>


          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Security is a core part of building trusted AI-powered decision
            intelligence. Diralis is designed to protect business data while
            delivering reliable insights and recommendations.
          </p>

        </div>


        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {securityPractices.map((item) => {
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
            Our Security Principles
          </h2>


          <div className="mt-6 space-y-5 text-slate-600">

            <div>
              <h3 className="font-semibold text-slate-900">
                Privacy by Design
              </h3>

              <p className="mt-1">
                Security and privacy considerations are integrated into the
                design of Diralis features, workflows, and infrastructure.
              </p>
            </div>


            <div>
              <h3 className="font-semibold text-slate-900">
                Least Privilege Access
              </h3>

              <p className="mt-1">
                Users and systems receive only the access required to perform
                their intended functions.
              </p>
            </div>


            <div>
              <h3 className="font-semibold text-slate-900">
                Continuous Improvement
              </h3>

              <p className="mt-1">
                As Diralis grows, security practices evolve alongside new
                technologies, integrations, and platform capabilities.
              </p>
            </div>

          </div>

        </div>


        <div className="mt-12 rounded-2xl bg-white p-8 text-center shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Building Trust Through Intelligence
          </h2>


          <p className="mx-auto mt-3 max-w-3xl text-slate-600">
            Businesses trust Diralis with valuable operational information.
            Our commitment is to provide intelligent decisions while
            maintaining a secure and reliable platform.
          </p>


          <a
            href="mailto:team.diralis@gmail.com"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Report a Security Concern
          </a>

        </div>


      </div>
    </div>
  );
}

