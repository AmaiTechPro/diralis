import { Link } from "react-router-dom";

export default function CookiePolicy() {
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
          Cookie Policy
        </h1>


        <p className="mt-2 text-sm text-slate-500">
          Last updated: August 2026
        </p>


        <section className="mt-8 space-y-4 text-slate-700">

          <h2 className="text-xl font-semibold text-slate-900">
            1. Introduction
          </h2>

          <p>
            This Cookie Policy explains how Diralis uses cookies and similar
            technologies to provide, improve, and secure our platform.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            2. What Are Cookies?
          </h2>

          <p>
            Cookies are small text files stored on your device when you visit
            a website. They help websites remember information and provide a
            better user experience.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            3. How Diralis Uses Cookies
          </h2>

          <p>
            Diralis may use cookies and similar technologies for purposes
            including:
          </p>


          <ul className="list-disc space-y-2 pl-6">

            <li>
              Maintaining secure user authentication sessions.
            </li>

            <li>
              Remembering user preferences and settings.
            </li>

            <li>
              Improving platform performance and reliability.
            </li>

            <li>
              Understanding how users interact with the platform.
            </li>

          </ul>


          <h2 className="text-xl font-semibold text-slate-900">
            4. Authentication and Security
          </h2>

          <p>
            Cookies or similar storage technologies may be used to maintain
            secure access to your Diralis account and protect against
            unauthorized activity.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            5. Third-Party Services
          </h2>

          <p>
            Some third-party services used by Diralis, such as authentication,
            hosting, analytics, or AI infrastructure providers, may use their
            own technologies according to their privacy policies.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            6. Managing Cookies
          </h2>

          <p>
            Most browsers allow users to control or delete cookies through
            browser settings. However, disabling certain cookies may affect
            platform functionality.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            7. Updates to This Policy
          </h2>

          <p>
            We may update this Cookie Policy as Diralis evolves and new
            features or technologies are introduced.
          </p>


          <h2 className="text-xl font-semibold text-slate-900">
            8. Contact
          </h2>

          <p>
            For questions about this Cookie Policy, contact:
          </p>

          <p className="font-medium">
            team.diralis@gmail.com
          </p>


        </section>

      </div>
    </div>
  );
}

