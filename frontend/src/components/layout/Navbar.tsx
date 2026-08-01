import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "../ui/icons";
import ThemeToggle from "../ui/ThemeToggle";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("features");


  useEffect(() => {

    const onScroll = () => {

      setScrolled(window.scrollY > 20);

      const sections = [
        "features",
        "how-it-works",
        "faq",
      ];

      let current = "features";


      sections.forEach((section) => {

        const element =
          document.getElementById(section);


        if (element) {

          const top =
            element.offsetTop - 120;


          if (window.scrollY >= top) {

            current = section;

          }

        }

      });


      setActiveSection(current);

    };


    window.addEventListener(
      "scroll",
      onScroll
    );


    onScroll();


    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );

  }, []);



  function handleGetStarted() {

    navigate("/register");

  }



  return (

    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">


        {/* Logo */}

        <a
          href="/"
          className="text-2xl font-extrabold tracking-tight text-white"
        >

          Dira
          <span className="text-cyan-400">
            lis
          </span>

        </a>



        {/* Desktop Navigation */}

        <nav className="hidden items-center gap-10 md:flex">

          {navItems.map((item) => (

            <a

              key={item.label}

              href={item.href}

              className={`text-sm transition ${
                activeSection === item.href.substring(1)
                  ? "text-cyan-400"
                  : "text-slate-300 hover:text-cyan-400"
              }`}

            >

              {item.label}

            </a>

          ))}

        </nav>




        {/* Desktop CTA */}

        <div className="hidden md:block">

          <motion.button

            whileHover={{
              scale: 1.05,
            }}

            whileTap={{
              scale: 0.96,
            }}

            onClick={handleGetStarted}

            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/30"

          >

            Get Started

          </motion.button>


        </div>




        {/* Mobile Menu Button */}

        <button

          onClick={() => setOpen(!open)}

          className="rounded-lg p-2 text-white md:hidden"

        >

          {open
            ? <X size={28}/>
            : <Menu size={28}/>
          }

        </button>


      </div>




      {/* Mobile Menu */}


      <AnimatePresence>


        {open && (


          <motion.div

            initial={{
              opacity:0,
              y:-15,
            }}

            animate={{
              opacity:1,
              y:0,
            }}

            exit={{
              opacity:0,
              y:-15,
            }}

            transition={{
              duration:0.25,
            }}

            className="fixed inset-0 z-50 flex flex-col border-t border-slate-800 bg-slate-950 md:hidden"

          >


            <div className="mt-24 flex flex-col gap-8 px-8">


              {navItems.map((item)=>(


                <a

                  key={item.label}

                  href={item.href}

                  onClick={() =>
                    setOpen(false)
                  }

                  className={`transition ${
                    activeSection === item.href.substring(1)
                      ? "text-cyan-400"
                      : "text-slate-300 hover:text-cyan-400"
                  }`}

                >

                  {item.label}


                </a>


              ))}



              <ThemeToggle />



              <button

                onClick={handleGetStarted}

                className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950"

              >

                Get Started


              </button>



            </div>


          </motion.div>


        )}

      </AnimatePresence>


    </header>

  );

}

