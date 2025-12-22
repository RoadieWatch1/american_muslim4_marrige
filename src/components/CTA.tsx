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
      // Logged in → go to pricing
      navigate('/pricing');
    } else {
      // Not logged in → open auth modal
      openAuthModal();
    }
  };

  const handleViewPricing = () => {
    if (user) {
      navigate('/pricing');
    } else {
      // Optional: you can still show pricing without login,
      // but per your requirement we open login modal
      openAuthModal();
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Find Your Life Partner?
        </h2>

        <p className="text-xl text-teal-100 mb-8">
          Join thousands of American Muslims seeking halal, marriage-focused connections
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleGetStarted}
          >
            Get Started Free
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="bg-white text-teal-600 border-white hover:bg-teal-50"
            onClick={handleViewPricing}
          >
            View Pricing
          </Button>
        </div>

        <p className="mt-6 text-teal-200 text-sm">
          No credit card required • Free forever plan available
        </p>
      </div>
    </section>
  );
};
