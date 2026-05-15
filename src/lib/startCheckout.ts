import { toast } from "sonner";
import { buildCheckoutUrl, PLAN_PRICING, type PaidTier } from "@/lib/ccbill";
import { supabase } from "@/lib/supabase";

/**
 * Sends the user to CCBill checkout via top-level same-tab navigation.
 *
 * Why same-tab (not window.open):
 *   The async auth lookup below consumes the browser's user-gesture window,
 *   so window.open(url, "_blank") gets silently blocked by popup blockers
 *   and the user has to click "Upgrade" twice with no feedback. Same-tab
 *   navigation has no gesture requirement and matches how Stripe Checkout
 *   and CCBill's own demos work — CCBill's Approval URL brings the user
 *   back to /checkout/success after payment.
 *
 * The Supabase user id is attached as a passthrough param so the webhook
 * can match the payment to the right profile.
 */
export async function startCheckout(tier: PaidTier) {
  const plan = PLAN_PRICING[tier];

  if (!plan.formDigest) {
    toast.error(
      `${tier.charAt(0).toUpperCase() + tier.slice(1)} checkout is not configured yet. Please contact support.`
    );
    return;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[CCBill] Failed to get current Supabase user:", error);
    toast.error("We couldn't verify your login. Please sign in again before upgrading.");
    return;
  }

  if (!user?.id) {
    toast.error("Please sign in before upgrading.");
    return;
  }

  const url = buildCheckoutUrl(tier, {
    supabaseUserId: user.id,
    email: user.email ?? null,
  });

  window.location.href = url;
}