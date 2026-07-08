import { CTA } from "../components/landing/cta";
import { Features } from "../components/landing/features";
import { Footer } from "../components/landing/footer";
import { Hero } from "../components/landing/hero";
import { HowItWorks } from "../components/landing/how-it-works";
import { Navbar } from "../components/landing/navbar";
import { Pricing } from "../components/landing/pricing";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 soft-grid opacity-60" />
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute -right-28 top-36 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}