import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

import { Crown, CreditCard, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PlanId = "free" | "silver" | "gold";

type ProfileSubscription = {
  subscription_tier: PlanId | null;
  subscription_status: "active" | "inactive" | string | null;
  subscription_end_date: string | null;
  subscription_cancel_at_period_end: boolean | null;
};

// Cancellations are handled manually for now: the user emails support, and the
// CCBill cancellation webhook updates the profile once support cancels in CCBill.
const SUPPORT_EMAIL = "support@americanmuslim4marriage.com";
const CANCEL_SUPPORT_MAILTO =
  "mailto:support@americanmuslim4marriage.com?subject=Cancel%20My%20AM4M%20Subscription";

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sub, setSub] = useState<ProfileSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCancelInfo, setShowCancelInfo] = useState(false);

  // Show toast after Stripe redirect: /dashboard/billing?success=1 or ?canceled=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");

    if (success) {
      toast({
        title: "Payment successful 🎉",
        description: "Your subscription will update shortly.",
      });
      // clean url
      params.delete("success");
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    }

    if (canceled) {
      toast({
        title: "Payment canceled",
        description: "No worries — you can upgrade anytime.",
        variant: "destructive",
      });
      params.delete("canceled");
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    fetchProfileSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchProfileSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status, subscription_end_date, subscription_cancel_at_period_end")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile subscription:", error);
        return;
      }

      setSub(data as ProfileSubscription);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const currentPlanId: PlanId = useMemo(() => {
    const t = sub?.subscription_tier;
    if (t === "silver" || t === "gold" || t === "free") return t;
    return "free";
  }, [sub?.subscription_tier]);

  const isActive = useMemo(() => {
    if (currentPlanId === "free") return false;
    return sub?.subscription_status === "active";
  }, [currentPlanId, sub?.subscription_status]);

  const cancelScheduled = useMemo(() => {
    return currentPlanId !== "free" && !!sub?.subscription_cancel_at_period_end && !!sub?.subscription_end_date;
  }, [currentPlanId, sub?.subscription_cancel_at_period_end, sub?.subscription_end_date]);

  const getTierIcon = (tier: PlanId) => {
    switch (tier) {
      case "gold":
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case "silver":
        return <CheckCircle className="w-5 h-5 text-teal-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierBadgeVariant = (tier: PlanId) => {
    switch (tier) {
      case "gold":
        return "default" as const;
      case "silver":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const planLabel = (tier: PlanId) => tier.charAt(0).toUpperCase() + tier.slice(1);

  const handleChangePlan = () => {
    window.location.href = "/pricing";
  };

  // Manual cancellation: reveal support-contact instructions instead of calling
  // the old Stripe cancel-subscription function.
  const handleCancelSubscription = () => {
    setShowCancelInfo(true);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </Button>

        <h1 className="mt-4 text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing in one place.</p>
      </div>

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
                      <Badge variant={getTierBadgeVariant(currentPlanId)}>{planLabel(currentPlanId)}</Badge>

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
                  <span>Subscription ends on {format(new Date(sub.subscription_end_date), "MMM dd, yyyy")}</span>
                </div>
              )}
            </div>

            {/* Only show warning if cancellation is scheduled */}
            {cancelScheduled && sub?.subscription_end_date && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Subscription Ending</AlertTitle>
                <AlertDescription>
                  Your subscription will end on {format(new Date(sub.subscription_end_date), "MMM dd, yyyy")}. You&apos;ll keep premium access until this date.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            {currentPlanId !== "free" ? (
              <>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleChangePlan} disabled={loading}>
                    {loading ? "Loading..." : "Manage Billing"}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={cancelScheduled}
                    title={cancelScheduled ? "Cancellation already scheduled" : undefined}
                  >
                    {cancelScheduled ? "Cancellation Scheduled" : "Cancel Subscription"}
                  </Button>
                </div>

                {showCancelInfo && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Cancel your subscription</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p>
                        To cancel your subscription, please contact AM4M Support at{" "}
                        <a className="font-medium underline" href={CANCEL_SUPPORT_MAILTO}>
                          {SUPPORT_EMAIL}
                        </a>
                        . Your membership will remain active until the end of your paid billing
                        period after cancellation is processed.
                      </p>
                      <Button asChild variant="outline">
                        <a href={CANCEL_SUPPORT_MAILTO}>Email AM4M Support</a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Unlock Premium Features</h3>
                <p className="text-sm text-gray-600 mb-4">Upgrade to Silver or Gold to unlock premium features.</p>
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
    </div>
  );
}
