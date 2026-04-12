import { CCBILL_WIDGET } from "@/lib/ccbill";

/**
 * Opens a modal overlay and injects the CCBill live widget script inside it.
 * CCBill's script renders the checkout form into the visible container.
 */
export function startCheckout(tier: "silver" | "gold") {
  const config = CCBILL_WIDGET[tier];

  if (!config?.className || config.className.startsWith("PASTE_")) {
    alert(
      `CCBill checkout for the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan is not configured yet. Please contact support.`
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

  // Close when clicking the backdrop
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // --- Modal container ---
  const modal = document.createElement("div");
  modal.style.cssText = `
    background: #fff; border-radius: 12px; padding: 24px;
    max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;
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

  // --- CCBill widget container (VISIBLE so the script can render into it) ---
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "ccbillWidgetContainer";

  const widgetScript = document.createElement("script");
  widgetScript.type = "text/javascript";
  widgetScript.className = config.className;
  widgetScript.src = CCBILL_WIDGET.scriptSrc;

  widgetContainer.appendChild(widgetScript);

  // Assemble modal
  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(widgetContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
