import React from 'react';
import { Button } from './ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useNavigate } from 'react-router-dom';

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
      // Logged in → go to real pricing / upgrade flow
      navigate('/pricing');
    } else {
      // Not logged in → open login/signup modal
      openAuthModal();
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Start free, upgrade when ready
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-2xl scale-105'
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <h3
                className={`text-2xl font-bold ${
                  plan.popular ? 'text-white' : 'text-gray-900'
                }`}
              >
                {plan.name}
              </h3>

              <div className="mt-4">
                <span
                  className={`text-5xl font-bold ${
                    plan.popular ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-lg ${
                    plan.popular ? 'text-teal-100' : 'text-gray-500'
                  }`}
                >
                  /{plan.period}
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={
                        plan.popular ? 'text-amber-300' : 'text-teal-600'
                      }
                    >
                      ✓
                    </span>
                    <span
                      className={
                        plan.popular ? 'text-teal-50' : 'text-gray-600'
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
