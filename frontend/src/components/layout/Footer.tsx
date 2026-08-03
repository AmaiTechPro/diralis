import { Link } from "react-router-dom";

export default function Footer() {
  const footerLinks = {
    Product: [
      {
        name: "Features",
        path: "/features",
      },
      {
        name: "How It Works",
        path: "/how-it-works",
      },
      {
        name: "Pricing",
        path: "/pricing",
      },
      {
        name: "Roadmap",
        path: "/roadmap",
      },
    ],

    Company: [
      {
        name: "About",
        path: "/about",
      },
      {
        name: "Contact",
        path: "/contact",
      },
    ],

    Resources: [
      {
        name: "Documentation",
        path: "/docs",
      },
      {
        name: "Support",
        path: "/support",
      },
    ],

    Legal: [
      {
        name: "Privacy Policy",
        path: "/privacy",
      },
      {
        name: "Terms of Service",
        path: "/terms",
      },
      {
        name: "Cookie Policy",
        path: "/cookies",
      },
      {
        name: "Security",
        path: "/security",
      },
    ],
  };


  return (
    <footer className="border-t border-slate-800 bg-slate-950">

      <div className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">


          {/* Brand */}

          <div className="lg:col-span-2">

            <h2 className="text-3xl font-bold text-cyan-400">
              Diralis
            </h2>


            <p className="mt-4 text-lg text-slate-300">
              Turn Business Data into Better Decisions.
            </p>


            <p className="mt-6 max-w-md leading-7 text-slate-400">
              An AI Decision Intelligence Platform helping businesses
              transform operational data into actionable insights,
              forecasts, recommendations, and confident decisions.
            </p>

          </div>



          {Object.entries(footerLinks).map(([title, links]) => (

            <div key={title}>

              <h3 className="font-semibold text-white">
                {title}
              </h3>


              <ul className="mt-6 space-y-3">

                {links.map((link) => (

                  <li key={link.name}>

                    <Link
                      to={link.path}
                      className="text-slate-400 transition hover:text-cyan-400"
                    >
                      {link.name}
                    </Link>

                  </li>

                ))}

              </ul>

            </div>

          ))}


        </div>



        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm text-slate-500 md:flex-row">

          <p>
            © 2026 Diralis. All rights reserved.
          </p>


          <p>
            Designed & Built by Brian David Amai
          </p>

        </div>


      </div>

    </footer>
  );
}

