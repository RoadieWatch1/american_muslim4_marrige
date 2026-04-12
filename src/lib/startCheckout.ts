import { buildCheckoutUrl, PLAN_PRICING, type PaidTier } from "@/lib/ccbill";

/**
 * Opens CCBill checkout as a new tab / top-level navigation.
 * CCBill blocks iframe embedding, so this is the only reliable method.
 */
export function startCheckout(tier: PaidTier) {
  const plan = PLAN_PRICING[tier];

  if (!plan.formDigest) {
    alert(
      `CCBill checkout for the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan is not fully configured yet (missing formDigest). Please contact support.`
    );
    return;
  }

  const url = buildCheckoutUrl(tier);
  window.open(url, "_blank");
}
