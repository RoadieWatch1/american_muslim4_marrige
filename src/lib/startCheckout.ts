import { buildCheckoutUrl, PLAN_PRICING, type PaidTier } from "@/lib/ccbill";

/**
 * Opens a modal overlay with the CCBill checkout form embedded as an iframe.
 * Uses dynamic pricing — both Silver and Gold go through subaccount 0000.
 */
export function startCheckout(tier: PaidTier) {
  const plan = PLAN_PRICING[tier];

  if (!plan.formDigest) {
    alert(
      `CCBill checkout for the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan is not fully configured yet (missing formDigest). Please contact support.`
    );
    return;
  }

  // Remove any existing checkout modal
  const existing = document.getElementById("ccbill-checkout-overlay");
  if (existing) existing.remove();

  // --- Overlay backdrop ---
  const overlay = document.createElement("div");
  overlay.id = "ccbill-checkout-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; justify-content: center;
  `;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // --- Modal container ---
  const modal = document.createElement("div");
  modal.style.cssText = `
    background: #fff; border-radius: 12px; padding: 24px;
    max-width: 520px; width: 90%; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: relative;
  `;

  // --- Close button ---
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "\u00d7";
  closeBtn.style.cssText = `
    position: absolute; top: 12px; right: 16px;
    background: none; border: none; font-size: 24px;
    cursor: pointer; color: #666; line-height: 1;
  `;
  closeBtn.addEventListener("click", () => overlay.remove());

  // --- Title ---
  const title = document.createElement("h2");
  title.textContent = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Checkout`;
  title.style.cssText = `
    margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111;
  `;

  // --- Iframe with CCBill dynamic pricing URL ---
  const iframe = document.createElement("iframe");
  iframe.src = buildCheckoutUrl(tier);
  iframe.title = `CCBill ${tier} checkout`;
  iframe.allow = "payment";
  iframe.style.cssText = `
    width: 100%; min-height: 450px; border: none;
  `;

  // Assemble modal
  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(iframe);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
