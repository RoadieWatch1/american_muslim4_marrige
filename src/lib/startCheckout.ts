import { CCBILL_LINKS } from "@/lib/ccbill";

export function startCheckout(tier: "silver" | "gold") {
  const url = CCBILL_LINKS[tier];

  if (!url || url.startsWith("PASTE_")) {
    alert(`CCBill checkout URL for the ${tier} plan is not configured yet. Please contact support.`);
    return;
  }

  window.location.href = url;
}
