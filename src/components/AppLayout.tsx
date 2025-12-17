import React from 'react';
import { Navigation } from './Navigation';
import { Hero } from './Hero';
import { Stats } from './Stats';
import { Features } from './Features';
import { HowItWorks } from './HowItWorks';
import { IslamicGuidelines } from './IslamicGuidelines';
import { DiscoverSection } from './DiscoverSection';
import { Community } from './Community';
import { TrustSafety } from './TrustSafety';
import { Testimonials } from './Testimonials';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { CTA } from './CTA';
import { Footer } from './Footer';

const AppLayout: React.FC = () => {
  return (
    // FIX: The 'bg-white' class has been removed. This div will now inherit the 'bg-background' color from App.tsx.
    <div className="min-h-screen"> 
      <Navigation />
      <main className="pt-16">
        <Hero />
        <Stats />
        <Features />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <IslamicGuidelines />
        <DiscoverSection />
        <Community />
        <TrustSafety />
        <Testimonials />
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