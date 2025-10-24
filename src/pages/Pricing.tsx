import { useState } from 'react';
import { Check, X, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const tiers = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'Get started with essential features',
    icon: Zap,
    features: [
      '3 matches per day',
      'Basic profile visibility',
      'Standard messaging',
      'Wali involvement',
      'Islamic guidelines',
    ],
    notIncluded: [
      'Unlimited matches',
      'Priority visibility',
      'Advanced filters',
      'Profile boost',
      'Read receipts',
    ],
    cta: 'Current Plan',
    priceId: null,
    tier: 'basic',
  },
  {
    name: 'Premium',
    price: '$9.99',
    priceMonthly: '/month',
    description: 'Unlock more matches and visibility',
    icon: Sparkles,
    popular: true,
    features: [
      'Unlimited matches',
      'Priority visibility',
      'Advanced filters',
      'See who liked you',
      'Message read receipts',
      'Wali involvement',
      'Islamic guidelines',
    ],
    notIncluded: [
      'Profile boost',
      'Top search results',
      'VIP support',
    ],
    cta: 'Upgrade to Premium',
    priceId: 'price_premium_999',
    tier: 'premium',
  },
  {
    name: 'Elite',
    price: '$19.99',
    priceMonthly: '/month',
    description: 'Maximum visibility and all features',
    icon: Crown,
    features: [
      'Everything in Premium',
      'Weekly profile boost',
      'Top search results',
      'VIP customer support',
      'Exclusive match suggestions',
      'Profile verification badge',
      'Advanced analytics',
    ],
    notIncluded: [],
    cta: 'Upgrade to Elite',
    priceId: 'price_elite_1999',
    tier: 'elite',
  },
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | null, tierName: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to upgrade your subscription',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (!priceId) return;

    setLoading(tierName);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/settings?tab=billing&success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const currentTier = profile?.subscription_tier || 'basic';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Find your perfect match with the right subscription
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentPlan = currentTier === tier.tier;
            const isDowngrade = 
              (currentTier === 'elite' && (tier.tier === 'premium' || tier.tier === 'basic')) ||
              (currentTier === 'premium' && tier.tier === 'basic');

            return (
              <Card 
                key={tier.name}
                className={`relative ${tier.popular ? 'border-pink-500 shadow-xl scale-105' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-pink-600" />
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.priceMonthly && (
                      <span className="text-gray-600">{tier.priceMonthly}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {tier.notIncluded.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 opacity-50">
                        <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : tier.popular ? 'default' : 'secondary'}
                    disabled={isCurrentPlan || loading !== null}
                    onClick={() => handleSubscribe(tier.priceId, tier.name)}
                  >
                    {loading === tier.name ? 'Processing...' : 
                     isCurrentPlan ? 'Current Plan' :
                     isDowngrade ? `Downgrade to ${tier.name}` : 
                     tier.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-gray-600 max-w-2xl mx-auto">
          <p>
            All plans include our commitment to Islamic values and guidelines. 
            Cancel or change your plan anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}