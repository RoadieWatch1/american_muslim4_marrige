import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export default function BillingManagement() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // In production, this would redirect to Stripe Customer Portal
      toast({
        title: 'Redirecting to billing portal...',
        description: 'You will be redirected to manage your subscription.',
      });
      
      // Simulate redirect
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      // In production, this would call Stripe API to cancel subscription
      toast({
        title: 'Subscription canceled',
        description: 'Your subscription will remain active until the end of the billing period.',
      });
      
      // Update local state
      if (subscription) {
        setSubscription({
          ...subscription,
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'elite':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'premium':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'default';
      case 'premium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing & Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTierIcon(profile?.subscription_tier || 'basic')}
                <div>
                  <p className="font-semibold">Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getTierBadgeVariant(profile?.subscription_tier || 'basic')}>
                      {profile?.subscription_tier?.charAt(0).toUpperCase() + 
                       profile?.subscription_tier?.slice(1) || 'Basic'}
                    </Badge>
                    {profile?.subscription_status === 'active' && (
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/pricing'}
              >
                Change Plan
              </Button>
            </div>

            {subscription && subscription.current_period_end && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {subscription.cancel_at_period_end ? (
                  <span>Subscription ends on {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}</span>
                ) : (
                  <span>Next billing date: {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}</span>
                )}
              </div>
            )}
          </div>

          {/* Cancellation Warning */}
          {subscription?.cancel_at_period_end && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Subscription Ending</AlertTitle>
              <AlertDescription>
                Your subscription will end on {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}. 
                You'll lose access to premium features after this date.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          {profile?.subscription_tier !== 'basic' && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Manage Billing'}
              </Button>
              
              {!subscription?.cancel_at_period_end && (
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                >
                  {canceling ? 'Canceling...' : 'Cancel Subscription'}
                </Button>
              )}
            </div>
          )}

          {/* Upgrade CTA for Basic users */}
          {profile?.subscription_tier === 'basic' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Unlock Premium Features</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get unlimited matches, priority visibility, and advanced filters with a premium subscription.
              </p>
              <Button onClick={() => window.location.href = '/pricing'}>
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your past payments and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            No payment history available. Your invoices will appear here after your first payment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}