import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "../ui/icons";
import ThemeToggle from "../ui/ThemeToggle";

const navItems = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
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
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-white"
        >
          Dira<span className="text-cyan-400">lis</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="text-sm text-slate-300 transition hover:text-cyan-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleGetStarted}
            className="rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition"
          >
            Get Started
          </motion.button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-white md:hidden"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col border-t border-slate-800 bg-slate-950 md:hidden"
          >
            <div className="mt-24 flex flex-col gap-6 px-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="text-lg text-slate-300 hover:text-cyan-400 transition"
                >
                  {item.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-4">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-slate-300 hover:text-white text-base font-medium"
                >
                  Sign In
                </Link>

                <ThemeToggle />

                <button
                  onClick={() => {
                    setOpen(false);
                    handleGetStarted();
                  }}
                  className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


