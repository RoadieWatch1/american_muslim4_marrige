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
  // Silver plan — $19.00/month (LIVE)
  silver: "https://api.ccbill.com/wap-frontflex/flexforms/03ff568e-0540-40a0-9271-bb564caa9029",

  // Gold plan — $39.00/month
  // Currently using the same FlexForm as Silver.
  // When you have a separate Gold flow in CCBill Admin, paste its URL here.
  gold: "https://api.ccbill.com/wap-frontflex/flexforms/03ff568e-0540-40a0-9271-bb564caa9029",
};

// After payment, CCBill will redirect users to these pages.
// Set these as your "Approval URL" and "Denial URL" in CCBill Admin
// under your FlexForms payment flow settings.
export const CCBILL_RETURN_URLS = {
  success: "https://www.americanmuslim4marriage.com/checkout/success",
  failed:  "https://www.americanmuslim4marriage.com/checkout/failed",
};
