// ─────────────────────────────────────────────────────────────────────────────
// CCBill FlexForms checkout configuration
// Client Account: 955247
//
// Silver — Subaccount: 0000 | Price ID: 1412 | $19.00/30 days recurring
// Gold   — Subaccount: 0001 | TBD           | $39.00/30 days recurring
// ─────────────────────────────────────────────────────────────────────────────

// CCBill LIVE Widget integration
// The widget script class encodes the Flex ID + form number.
// Format: CCBillWidget{FLEX_ID}_{FORM_NUMBER}
export const CCBILL_WIDGET = {
  scriptSrc: "https://images.ccbill.com/flexforms2/ccbill-widget-live.js",

  silver: {
    className: "CCBillWidget03ff568e-0540-40a0-9271-bb564caa9029_32231",
  },

  // Gold — paste the widget class from your Gold flow's Widget Code here.
  // Find it in CCBill Admin → FlexForms → Gold flow → Widget Code
  // It will look like: CCBillWidgetXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX_NNNNN
  gold: {
    className: "PASTE_GOLD_WIDGET_CLASS_HERE",
  },
};

// After payment, CCBill redirects users to these pages.
// Set these as your "Approval URL" and "Denial URL" in CCBill Admin
// under your FlexForms payment flow settings.
export const CCBILL_RETURN_URLS = {
  success: "https://www.americanmuslim4marriage.com/checkout/success",
  failed: "https://www.americanmuslim4marriage.com/checkout/failed",
};
