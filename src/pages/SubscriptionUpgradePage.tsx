import React, { useMemo, useState } from 'react';
import { startCheckout } from "@/lib/startCheckout";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type PlanId = 'free' | 'silver' | 'gold';

type Plan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  highlight?: boolean;
  maxLikesLabel: string;
  maxSuperIntrosLabel: string;
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Browse profiles',
      'Basic filters',
      'Standard support',
    ],
    maxLikesLabel: '10 likes per day',
    maxSuperIntrosLabel: '1 Super-Intro per day',
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '$19',
    period: 'per month',
    features: [
      'Everything in Free',
      'Advanced filters',
      'Read receipts',
      'Priority support',
      'See who liked you',
    ],
    popular: true,
    highlight: true,
    maxLikesLabel: 'Unlimited likes',
    maxSuperIntrosLabel: '21 Super-Intros per day',
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$39',
    period: 'per month',
    features: [
      'Everything in Silver',
      'Priority verification badge',
      'Boosted profile visibility',
      'Premium support',
      'Profile insights',
    ],
    maxLikesLabel: 'Unlimited likes',
    maxSuperIntrosLabel: 'Unlimited Super-Intros',
  },
];

export default function SubscriptionUpgradePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<PlanId | null>(null);

  const currentPlanId: PlanId = useMemo(() => {
    if (!profile?.subscription_tier) return 'free';
    if (profile.subscription_tier === 'silver') return 'silver';
    if (profile.subscription_tier === 'gold') return 'gold';
    return 'free';
  }, [profile?.subscription_tier]);

  const currentPlan = plans.find((p) => p.id === currentPlanId);

  // const handleChangePlan = async (planId: PlanId) => {
  //   if (!user) {
  //     navigate('/login');
  //     return;
  //   }

  //   if (planId === currentPlanId) {
  //     toast.info(`You are already on the ${currentPlan?.name ?? 'current'} plan.`);
  //     return;
  //   }

  //   try {
  //     setLoadingPlanId(planId);

  //     const nextStatus = planId === 'free' ? 'inactive' : 'active';

  //     const { error } = await supabase
  //       .from('profiles')
  //       .update({
  //         subscription_tier: planId,
  //         subscription_status: nextStatus,
  //         subscription_end_date: null,
  //         updated_at: new Date().toISOString(),
  //       })
  //       .eq('id', user.id);

  //     if (error) {
  //       console.error('Error updating subscription:', error);
  //       toast.error('Could not update your plan. Please try again.');
  //       return;
  //     }

  //     await refreshProfile?.();

  //     const newPlan = plans.find((p) => p.id === planId);
  //     toast.success(
  //       planId === 'free'
  //         ? 'You are now on the Free plan.'
  //         : `Successfully switched to the ${newPlan?.name ?? 'new'} plan.`
  //     );
  //   } catch (err) {
  //     console.error(err);
  //     toast.error('Something went wrong. Please try again.');
  //   } finally {
  //     setLoadingPlanId(null);
  //   }
  // };

  const handleChangePlan = async (planId: PlanId) => {
  if (!user) {
    navigate("/login");
    return;
  }

  if (planId === currentPlanId) {
    toast.info(`You are already on the ${currentPlan?.name ?? "current"} plan.`);
    return;
  }

  try {
    setLoadingPlanId(planId);

    // ✅ Paid plans must go through Stripe Checkout
    if (planId === "silver" || planId === "gold") {
      await startCheckout(planId); // redirects
      return;
    }

    // ✅ Free plan: downgrade locally (optional)
    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_status: "inactive",
        stripe_subscription_id: null,
        subscription_end_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating subscription:", error);
      toast.error("Could not update your plan. Please try again.");
      return;
    }

    await refreshProfile?.();
    toast.success("You are now on the Free plan.");
  } catch (err: any) {
    console.error(err);
    toast.error(err?.message || "Something went wrong. Please try again.");
  } finally {
    setLoadingPlanId(null);
  }
};


  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Please log in to manage your subscription.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>

          <div className="text-right">
            <p className="text-sm text-gray-500">Current plan</p>
            <p className="font-semibold text-gray-900">
              {currentPlan?.name ?? 'Free'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Likes: {currentPlan?.maxLikesLabel} · Super-Intros:{' '}
              {currentPlan?.maxSuperIntrosLabel}
            </p>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Choose Your Plan
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Start with Free, upgrade to Silver or Gold when you’re ready.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isLoading = loadingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-transform ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-2xl scale-105'
                    : 'bg-white border-2 border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <h3
                  className={`text-2xl font-bold ${
                    plan.highlight ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.name}
                </h3>

                <div className="mt-4">
                  <span
                    className={`text-5xl font-bold ${
                      plan.highlight ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-lg ${
                      plan.highlight ? 'text-teal-100' : 'text-gray-500'
                    }`}
                  >
                    /{plan.period}
                  </span>
                </div>

                <p
                  className={`mt-3 text-sm font-medium ${
                    plan.highlight ? 'text-teal-100' : 'text-gray-600'
                  }`}
                >
                  Likes: {plan.maxLikesLabel}
                  <br />
                  Super-Intros: {plan.maxSuperIntrosLabel}
                </p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className={
                          plan.highlight ? 'text-amber-300' : 'text-teal-600'
                        }
                      >
                        ✓
                      </span>
                      <span
                        className={
                          plan.highlight ? 'text-teal-50' : 'text-gray-600'
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight ? 'secondary' : 'default'}
                  className="w-full mt-8"
                  disabled={isCurrent || isLoading}
                  onClick={() => handleChangePlan(plan.id)}
                >
                  {isLoading
                    ? 'Updating...'
                    : isCurrent
                    ? 'Current Plan'
                    : plan.id === 'free'
                    ? 'Switch to Free'
                    : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
