import React, { useState } from 'react';
import { Button } from './ui/Button';
import { AuthModal } from './auth/AuthModal';
import { CheckCircle } from 'lucide-react';

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
            <div className="max-w-3xl animate-fade-in">

              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-wide">
                Your Intentions.
                <br />
                <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Our Structure.
                </span>
              </h1>

             <p className="mt-6 text-xl text-foreground/90 leading-relaxed">
                An exclusive, chaperone-friendly platform where commitment,
                faith, and family blessing come first.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white border-0 hover:from-teal-500 hover:to-emerald-400 shadow-lg shadow-teal-500/30 font-semibold px-8"
                >
                  Get Started Free
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={scrollToDiscover}
                  className="border-white/30 bg-white/10 backdrop-blur-sm text-foreground hover:bg-white/20 font-semibold px-8"
                >
                  Learn More
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {['Verified Profiles', 'Wali Involvement', '100% Halal'].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-sm text-foreground/90"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    {label}
                  </span>
                ))}
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
