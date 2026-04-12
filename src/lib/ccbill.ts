// ─────────────────────────────────────────────────────────────────────────────
// CCBill FlexForms checkout URLs
// Client Account: 955247 | Subaccount: 0000
//
// HOW TO GET YOUR URLs:
//   1. Log in to CCBill Admin → Account Management → FlexForms
//   2. Open your payment flow → click "Widget Code"
//   3. Copy the URL that starts with:
//      https://api.ccbill.com/wap-frontflex/flexforms/...
//   4. Paste each plan's URL below.
//
// RETURN URLS are appended automatically by CCBill after payment.
// ─────────────────────────────────────────────────────────────────────────────

export const CCBILL_LINKS: Record<"silver" | "gold", string> = {
  // Silver plan — $19.00/month
  silver: "PASTE_SILVER_CCBILL_FLEXFORM_URL_HERE",

  // Gold plan — $39.00/month
  gold: "PASTE_GOLD_CCBILL_FLEXFORM_URL_HERE",
};

// After payment, CCBill will redirect users to these pages.
// Set these as your "Approval URL" and "Denial URL" in CCBill Admin
// under your FlexForms payment flow settings.
export const CCBILL_RETURN_URLS = {
  success: "https://www.americanmuslim4marriage.com/checkout/success",
  failed:  "https://www.americanmuslim4marriage.com/checkout/failed",
};
