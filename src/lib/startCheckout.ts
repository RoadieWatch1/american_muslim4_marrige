import { CCBILL_WIDGET } from "@/lib/ccbill";

/**
 * Launches the CCBill FlexForms checkout widget for the given plan.
 *
 * How it works:
 *  1. Creates a hidden container with the widget class CCBill expects
 *  2. Injects the CCBill live widget script
 *  3. CCBill's script detects the container and opens the checkout overlay
 */
export function startCheckout(tier: "silver" | "gold") {
  const config = CCBILL_WIDGET[tier];

  if (!config?.className || config.className.startsWith("PASTE_")) {
    alert(
      `CCBill checkout for the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan is not configured yet. Please contact support.`
    );
    return;
  }

  // Remove any previous widget containers so we don't stack them
  document
    .querySelectorAll(".ccbillWidgetContainer")
    .forEach((el) => el.remove());

  // Create the widget container CCBill's script looks for
  const container = document.createElement("div");
  container.className = "ccbillWidgetContainer";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "0";
  container.style.height = "0";
  container.style.overflow = "hidden";
  container.style.zIndex = "99999";

  // The script element with the class that identifies the specific flow
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.className = config.className;
  script.src = CCBILL_WIDGET.scriptSrc;

  container.appendChild(script);
  document.body.appendChild(container);
}
