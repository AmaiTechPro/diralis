import { Link } from "react-router-dom";

export default function TermsOfService() {
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
          Terms of Service
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Last updated: August 2026
        </p>

        <section className="mt-8 space-y-4 text-slate-700">

          <h2 className="text-xl font-semibold text-slate-900">
            1. Acceptance of Terms
          </h2>

          <p>
            By accessing or using Diralis, you agree to these Terms of
            Service. If you do not agree with these terms, you should not
            use the platform.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            2. About Diralis
          </h2>

          <p>
            Diralis is an AI-powered decision intelligence platform designed
            to help businesses analyze data, generate insights, create
            forecasts, and support better decision-making.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            3. User Accounts
          </h2>

          <p>
            Users are responsible for maintaining the security of their
            account credentials and ensuring that account information is
            accurate.
          </p>

          <p>
            Users must not share accounts, attempt unauthorized access, or
            misuse the platform.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            4. User Data and Content
          </h2>

          <p>
            Users retain ownership of the business data and information they
            upload to Diralis.
          </p>

          <p>
            By uploading data, users grant Diralis permission to process that
            information solely for providing analytics, reports, and platform
            functionality.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            5. AI-Generated Insights
          </h2>

          <p>
            Diralis uses artificial intelligence to generate recommendations,
            summaries, predictions, and insights.
          </p>

          <p>
            AI-generated information is provided as assistance and should not
            be considered a guarantee, professional advice, or a replacement
            for human judgment.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            6. Acceptable Use
          </h2>

          <p>
            Users agree not to use Diralis for illegal activities, attempting
            to compromise platform security, or activities that may harm other
            users.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            7. Service Availability
          </h2>

          <p>
            We aim to keep Diralis available and reliable but cannot guarantee
            uninterrupted access due to maintenance, updates, or third-party
            service limitations.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            8. Account Termination
          </h2>

          <p>
            Diralis may restrict or terminate accounts that violate these
            terms or misuse the platform.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            9. Changes to These Terms
          </h2>

          <p>
            We may update these Terms of Service as Diralis evolves. Continued
            use of the platform after updates means you accept the revised
            terms.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            10. Contact
          </h2>

          <p>
            For questions about these terms, contact:
          </p>

          <p className="font-medium">
            team.diralis@gmail.com
          </p>

        </section>

      </div>
    </div>
  );
}

