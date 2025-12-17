import React, { useState } from 'react';
import { Button } from './ui/Button';
import { AuthModal } from './auth/AuthModal';

export const Hero: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const scrollToDiscover = () => {
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <section className="relative min-h-screen w-full overflow-hidden bg-background">

        {/* FULL-BLEED BACKGROUND IMAGE */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-couple.png"
            alt="Happy Muslim couple"
            className="w-full h-full object-cover object-center"
          />

          {/* Subtle luxury contrast for text legibility (not faded) */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/30 to-transparent" />
        </div>

        {/* ISLAMIC PATTERN OVERLAY — HERITAGE PINE */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23344039'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 flex min-h-screen items-center">
          <div className="w-full max-w-7xl mx-auto px-6 py-28">
            <div className="max-w-3xl">

              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-wide">
                Your Intentions.
                <br />
                <span className="text-primary">Our Structure.</span>
              </h1>

              <p className="mt-6 text-xl text-accent leading-relaxed">

                An exclusive, chaperone-friendly platform where commitment,
                faith, and family blessing come first.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button size="lg" onClick={() => setShowAuthModal(true)}>
                  Get Started Free
                </Button>

                <Button variant="outline" size="lg" onClick={scrollToDiscover}>
                  Learn More
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-foreground/80">
                <span className="flex items-center gap-2">
                  <span className="text-primary text-xl">✓</span>
                  Verified Profiles
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-primary text-xl">✓</span>
                  Wali Involvement
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-primary text-xl">✓</span>
                  100% Halal
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
