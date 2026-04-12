// ─────────────────────────────────────────────────────────────────────────────
// CCBill FlexForms — Dynamic Pricing Checkout
// Client Account: 955247
//
// Subaccount 0000 → recurring (subscriptions)   ← Silver & Gold both use this
// Subaccount 0001 → non-recurring (one-time)    ← reserved for future use
//
// CCBill support confirmed: both Silver and Gold monthly subscriptions should
// use subaccount 0000 with dynamic pricing to set the amount per plan.
// ─────────────────────────────────────────────────────────────────────────────

const CCBILL_CONFIG = {
  clientAccnum: "955247",
  clientSubacc: "0000",               // recurring subscription subaccount
  currencyCode: "840",                // USD

  // The Flex ID for the recurring payment flow (from CCBill Admin → FlexForms)
  flexId: "03ff568e-0540-40a0-9271-bb564caa9029",

  // formDigest — MD5 hash of all dynamic pricing values concatenated + salt.
  // Salt is the encryption key for subaccount 0000 (found in CCBill Admin).
  // Concatenation order (no separators):
  //   initialPrice + initialPeriod + recurringPrice + recurringPeriod + numRebills + currencyCode + salt
  //
  // Silver digest input: "19.003019.003099840" + SALT  → MD5(full string)
  // Gold   digest input: "39.003039.003099840" + SALT  → MD5(full string)
  //
  // IMPORTANT: Dynamic Pricing must be enabled on the FlexForms payment flow
  // in CCBill Admin, or the request will fail even with a valid digest.
} as const;

export type PaidTier = "silver" | "gold";

interface PlanPricing {
  initialPrice: string;   // e.g. "19.00"
  initialPeriod: string;  // days, e.g. "30"
  recurringPrice: string; // e.g. "19.00"
  recurringPeriod: string; // days, e.g. "30"
  numRebills: string;     // "99" = indefinite recurring
  formDigest: string;     // pre-computed MD5 digest (see above)
}

export const PLAN_PRICING: Record<PaidTier, PlanPricing> = {
  silver: {
    initialPrice: "19.00",
    initialPeriod: "30",
    recurringPrice: "19.00",
    recurringPeriod: "30",
    numRebills: "99",
    formDigest: "13cc159fe31d77904fa0c18fb72ce8a9",
  },
  gold: {
    initialPrice: "39.00",
    initialPeriod: "30",
    recurringPrice: "39.00",
    recurringPeriod: "30",
    numRebills: "99",
    formDigest: "9ea5522c134632698fa3b29bcb695340",
  },
};

/**
 * Builds the CCBill FlexForms dynamic pricing checkout URL.
 *
 * This URL can be:
 *  - opened as a redirect (window.location.href = url)
 *  - embedded in an iframe for inline checkout
 *
 * Docs: CCBill FlexForms → Dynamic Pricing
 */
export function buildCheckoutUrl(tier: PaidTier): string {
  const plan = PLAN_PRICING[tier];

  const params = new URLSearchParams({
    clientAccnum: CCBILL_CONFIG.clientAccnum,
    clientSubacc: CCBILL_CONFIG.clientSubacc,
    initialPrice: plan.initialPrice,
    initialPeriod: plan.initialPeriod,
    recurringPrice: plan.recurringPrice,
    recurringPeriod: plan.recurringPeriod,
    numRebills: plan.numRebills,
    currencyCode: CCBILL_CONFIG.currencyCode,
    formDigest: plan.formDigest,
  });

  return `https://api.ccbill.com/wap-frontflex/flexforms/${CCBILL_CONFIG.flexId}?${params.toString()}`;
}

// After payment, CCBill redirects users to these pages.
// Set these as your "Approval URL" and "Denial URL" in CCBill Admin
// under your FlexForms payment flow settings.
export const CCBILL_RETURN_URLS = {
  success: "https://www.americanmuslim4marriage.com/checkout/success",
  failed: "https://www.americanmuslim4marriage.com/checkout/failed",
};

// ── Legacy widget config (kept for reference, no longer used) ──────────────
// The widget approach used a <script class="CCBillWidget{flexId}_{formNumber}">
// but does not support dynamic pricing. We now use iframe-embedded FlexForms URLs.
export const CCBILL_WIDGET = {
  scriptSrc: "https://images.ccbill.com/flexforms2/ccbill-widget-live.js",
  silver: {
    className: "CCBillWidget03ff568e-0540-40a0-9271-bb564caa9029_32231",
  },
  gold: {
    className: "PASTE_GOLD_WIDGET_CLASS_HERE",
  },
};
