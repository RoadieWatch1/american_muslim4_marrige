import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PlanId = 'free' | 'silver' | 'gold';

type ProfileSubscription = {
  subscription_tier: PlanId | null;
  subscription_status: 'active' | 'inactive' | string | null;
  subscription_end_date: string | null; // ISO string or null
  subscription_cancel_at_period_end: boolean | null;
};

export default function BillingManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sub, setSub] = useState<ProfileSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchProfileSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchProfileSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'subscription_tier, subscription_status, subscription_end_date, subscription_cancel_at_period_end'
        )
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile subscription:', error);
        return;
      }

      setSub(data as ProfileSubscription);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const currentPlanId: PlanId = useMemo(() => {
    const t = sub?.subscription_tier;
    if (t === 'silver' || t === 'gold' || t === 'free') return t;
    return 'free';
  }, [sub?.subscription_tier]);

  const isActive = useMemo(() => {
    if (currentPlanId === 'free') return false;
    return sub?.subscription_status === 'active';
  }, [currentPlanId, sub?.subscription_status]);

  const cancelScheduled = useMemo(() => {
    return (
      currentPlanId !== 'free' &&
      !!sub?.subscription_cancel_at_period_end &&
      !!sub?.subscription_end_date
    );
  }, [currentPlanId, sub?.subscription_cancel_at_period_end, sub?.subscription_end_date]);

  const getTierIcon = (tier: PlanId) => {
    switch (tier) {
      case 'gold':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'silver':
        return <CheckCircle className="w-5 h-5 text-teal-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierBadgeVariant = (tier: PlanId) => {
    switch (tier) {
      case 'gold':
        return 'default' as const;
      case 'silver':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const planLabel = (tier: PlanId) => tier.charAt(0).toUpperCase() + tier.slice(1);

  const handleChangePlan = () => {
    window.location.href = '/pricing';
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;

    setCanceling(true);
    try {
      toast({
        title: 'Canceling subscription...',
        description: 'You will keep access until the current period ends.',
      });

      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) {
        console.error('cancel-subscription error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to cancel subscription. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (!data?.ok) {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to cancel subscription. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      await fetchProfileSubscription();

      toast({
        title: 'Cancellation scheduled',
        description: data?.subscription_end_date
          ? `You will keep access until ${format(new Date(data.subscription_end_date), 'MMM dd, yyyy')}.`
          : 'You will keep access until the current period ends.',
      });
    } finally {
      setCanceling(false);
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
          <CardDescription>Manage your subscription and billing information</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTierIcon(currentPlanId)}
                <div>
                  <p className="font-semibold">Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getTierBadgeVariant(currentPlanId)}>
                      {planLabel(currentPlanId)}
                    </Badge>

                    {isActive && (
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    )}

                    {cancelScheduled && (
                      <Badge variant="outline" className="text-amber-600">
                        Ending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={handleChangePlan}>
                Change Plan
              </Button>
            </div>

            {/* End date */}
            {sub?.subscription_end_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Subscription ends on {format(new Date(sub.subscription_end_date), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Only show this warning if cancellation is scheduled */}
          {cancelScheduled && sub?.subscription_end_date && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Subscription Ending</AlertTitle>
              <AlertDescription>
                Your subscription will end on{' '}
                {format(new Date(sub.subscription_end_date), 'MMM dd, yyyy')}. You&apos;ll keep
                premium access until this date.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          {currentPlanId !== 'free' ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleChangePlan} disabled={loading}>
                {loading ? 'Loading...' : 'Manage Billing'}
              </Button>

              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={canceling || cancelScheduled}
                title={cancelScheduled ? 'Cancellation already scheduled' : undefined}
              >
                {cancelScheduled
                  ? 'Cancellation Scheduled'
                  : canceling
                  ? 'Updating...'
                  : 'Cancel Subscription'}
              </Button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Unlock Premium Features</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upgrade to Silver or Gold to unlock premium features.
              </p>
              <Button onClick={handleChangePlan}>View Plans</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History (static for now) */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
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