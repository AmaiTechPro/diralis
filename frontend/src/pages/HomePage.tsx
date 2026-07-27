import Navbar from "../components/layout/Navbar";
import Hero from "../components/sections/Hero";
import Problem from "../components/sections/Problem";
import Solution from "../components/sections/Solution";
import Features from "../components/sections/Features";
import HowItWorks from "../components/sections/HowItWorks";
import WhyDiralis from "../components/sections/WhyDiralis";
import DashboardPreview from "../components/sections/DashboardPreview";
import CTA from "../components/sections/CTA";
import Footer from "../components/layout/Footer";
import FAQ from "../components/sections/FAQ";

export default function HomePage() {
  return (
    <main className="bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks />
      <WhyDiralis />
      <DashboardPreview />
      <CTA />
      <FAQ />
      <Footer />
    </main>
  );
}


