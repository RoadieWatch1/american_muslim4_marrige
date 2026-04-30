import React from 'react';
import { Button } from './ui/Button';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const CTA: React.FC = () => {
  const { openAuthModal } = useAuthModal();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/pricing');
    } else {
      openAuthModal();
    }
  };

  const handleViewPricing = () => {
    if (user) {
      navigate('/pricing');
    } else {
      openAuthModal();
    }
  };

  return (
    <section className="relative py-20 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[200px] h-[200px] bg-emerald-400/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[200px] h-[200px] bg-teal-300/8 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-teal-100 to-emerald-200 bg-clip-text text-transparent">
          Ready to Find Your Life Partner?
        </h2>

        <p className="text-xl text-slate-300 mb-8">
          Join thousands of American Muslims seeking halal, marriage-focused connections
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-teal-500 to-emerald-400 text-white border-0 hover:from-teal-400 hover:to-emerald-300 shadow-lg shadow-teal-500/30 font-semibold px-8"
          >
            Get Started Free
          </Button>

          <Button
            size="lg"
            onClick={handleViewPricing}
            className="bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 font-semibold px-8"
          >
            View Pricing
          </Button>
        </div>

        <p className="mt-6 text-slate-400 text-sm">
          No credit card required • Free forever plan available
        </p>
      </div>
    </section>
  );
};
