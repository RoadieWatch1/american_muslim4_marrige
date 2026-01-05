import React from "react";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { Stats } from "./Stats";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { IslamicGuidelines } from "./IslamicGuidelines";
import { DiscoverSection } from "./DiscoverSection";
import { Community } from "./Community";
import { TrustSafety } from "./TrustSafety";
import { Testimonials } from "./Testimonials";
import { Pricing } from "./Pricing";
import { FAQ } from "./FAQ";
import { CTA } from "./CTA";
import { Footer } from "./Footer";
import { AboutSection } from "./AboutSection";

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        <Hero />
        <Stats />
                
        <div id="features">
          <Features />
        </div>

        <div id="how-it-works">
          <HowItWorks />
        </div>

        <div id="islamic_guidelines">
          <IslamicGuidelines />
        </div>

        <DiscoverSection />
        <Community />

        <div id="trust_safety">
          <TrustSafety />
        </div>

        <div id="success_stories">
          <Testimonials />
        </div>        
        
        <div id="about">
          <AboutSection />
        </div>

        <div id="pricing">
          <Pricing />
        </div>

        <div id="faq">
          <FAQ />
        </div>

        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;