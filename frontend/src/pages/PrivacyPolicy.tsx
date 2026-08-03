import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">

        <Link
          to="/"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Diralis
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Privacy Policy
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Last updated: August 2026
        </p>

        <section className="mt-8 space-y-4 text-slate-700">

          <h2 className="text-xl font-semibold text-slate-900">
            1. Introduction
          </h2>

          <p>
            Diralis is an AI-powered decision intelligence platform that
            helps businesses transform their data into insights,
            recommendations, forecasts, and reports.
          </p>

          <p>
            This Privacy Policy explains how we collect, use, and protect
            information when you use the Diralis platform.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            2. Information We Collect
          </h2>

          <p>
            We may collect information you provide when creating an account,
            including your name, username, email address, and authentication
            information.
          </p>

          <p>
            If you sign in using Google, we may receive information provided
            by Google such as your name, email address, and profile picture.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            3. Business Data You Upload
          </h2>

          <p>
            Diralis allows users to upload business datasets such as sales,
            inventory, and operational information for analysis.
          </p>

          <p>
            Uploaded data is used only to provide analytics, visualizations,
            AI insights, forecasts, and related platform features.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            4. Artificial Intelligence Processing
          </h2>

          <p>
            Diralis uses artificial intelligence features to generate
            recommendations and insights from user-provided information.
            AI-generated outputs should be reviewed before making important
            business decisions.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            5. Data Security
          </h2>

          <p>
            We use appropriate technical measures including authentication,
            access controls, and secure infrastructure to protect user
            information.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            6. Third-Party Services
          </h2>

          <p>
            Diralis may use trusted third-party services for authentication,
            hosting, databases, and artificial intelligence capabilities.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            7. Your Rights
          </h2>

          <p>
            Users may request access, correction, or deletion of their
            account information by contacting us.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            8. Contact Us
          </h2>

          <p>
            For privacy-related questions, contact:
          </p>

          <p className="font-medium">
            team.diralis@gmail.com
          </p>

        </section>

      </div>
    </div>
  );
}

