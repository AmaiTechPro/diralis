

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
import FadeIn from "../components/ui/FadeIn";
import SocialProof from "../components/sections/SocialProof";
import Metrics from "../components/sections/Metrics";
import Testimonials from "../components/sections/Testimonials";
import Pricing from "../components/sections/Pricing";






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
      <SocialProof />
      <Metrics />
      <Testimonials />
      <Pricing />
       <CTA /> 
       <Footer/> 
      <FAQ/> 
      <FadeIn children={undefined}/> 
      

    </main>
  );
}





