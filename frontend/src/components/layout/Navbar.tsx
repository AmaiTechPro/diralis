export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        <div className="text-2xl font-bold tracking-tight">
          Dira<span className="text-cyan-400">lis</span>
        </div>

        <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="hover:text-cyan-400 transition">
            Features
          </a>

          <a href="#how-it-works" className="hover:text-cyan-400 transition">
            How It Works
          </a>

          <a href="#beta" className="hover:text-cyan-400 transition">
            Join Beta
          </a>
        </nav>

        <button className="rounded-lg bg-cyan-500 px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition">
          Get Started
        </button>

      </div>
    </header>
  );
}


