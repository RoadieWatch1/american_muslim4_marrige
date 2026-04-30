import React from 'react';
import { Button } from './ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Browse profiles',
      'Limited likes per day',
      '1 Super-Intro per day',
      'Basic filters',
      'Standard support'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Silver',
    price: '$19',
    period: 'per month',
    features: [
      'Unlimited likes',
      'Advanced filters',
      'Read receipts',
      '5 Super-Intros per day',
      'Priority support',
      'See who liked you'
    ],
    cta: 'Start Silver',
    popular: true
  },
  {
    name: 'Gold',
    price: '$39',
    period: 'per month',
    features: [
      'Everything in Silver',
      'Priority verification badge',
      'Boosted profile visibility',
      'Unlimited Super-Intros',
      'Premium support',
      'Profile insights'
    ],
    cta: 'Go Gold',
    popular: false
  }
];

export const Pricing: React.FC = () => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();

  const handleSelectPlan = () => {
    if (user) {
      navigate('/pricing');
    } else {
      openAuthModal();
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-foreground/60">
            Start free, upgrade when ready
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-2xl shadow-teal-500/30 scale-105 ring-1 ring-teal-400/50'
                  : 'bg-background border border-border/60 hover:border-teal-400/40 transition-colors duration-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-lg shadow-amber-400/30">
                  Most Popular
                </div>
              )}

              <h3
                className={`text-2xl font-bold ${
                  plan.popular ? 'text-white' : 'text-foreground'
                }`}
              >
                {plan.name}
              </h3>

              <div className="mt-4">
                <span
                  className={`text-5xl font-bold ${
                    plan.popular ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-lg ${
                    plan.popular ? 'text-teal-100' : 'text-foreground/50'
                  }`}
                >
                  /{plan.period}
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-amber-300' : 'text-teal-500'}`}
                    />
                    <span
                      className={
                        plan.popular ? 'text-teal-50' : 'text-foreground/70'
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'secondary' : 'default'}
                className="w-full mt-8"
                onClick={handleSelectPlan}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
