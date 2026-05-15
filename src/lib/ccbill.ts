// ─────────────────────────────────────────────────────────────────────────────
// CCBill FlexForms — Dynamic Pricing Checkout
// Client Account: 955247
//
// Subaccount 0000 → recurring (subscriptions)   ← Silver & Gold both use this
// Subaccount 0001 → non-recurring (one-time)    ← reserved for future use
//
// CCBill support confirmed: both Silver and Gold monthly subscriptions should
// use subaccount 0000 with dynamic pricing to set the amount per plan.
//
// Passthrough parameters:
// We send the Supabase user id and selected tier to CCBill as query params.
// CCBill returns passthrough params to Webhooks with an X- prefix.
// Example:
//   sent:     supabaseUserId=abc-123
//   webhook:  X-supabaseUserId=abc-123
// ─────────────────────────────────────────────────────────────────────────────

const CCBILL_CONFIG = {
  clientAccnum: "955247",
  clientSubacc: "0000", // recurring subscription subaccount
  currencyCode: "840", // USD

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
  //
  // IMPORTANT: Passthrough parameters are not included in this digest.
} as const;

export type PaidTier = "silver" | "gold";

interface PlanPricing {
  initialPrice: string; // e.g. "19.00"
  initialPeriod: string; // days, e.g. "30"
  recurringPrice: string; // e.g. "19.00"
  recurringPeriod: string; // days, e.g. "30"
  numRebills: string; // "99" = indefinite recurring
  formDigest: string; // pre-computed MD5 digest
}

interface BuildCheckoutUrlOptions {
  supabaseUserId: string;
  email?: string | null;
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
 * Open this as a top-level navigation (window.open or window.location.href).
 * CCBill blocks iframe embedding (X-Frame-Options).
 *
 * The supabaseUserId and tier are passthrough fields used later by the
 * CCBill webhook to update the correct Supabase profile after payment.
 */
export function buildCheckoutUrl(
  tier: PaidTier,
  options: BuildCheckoutUrlOptions
): string {
  const plan = PLAN_PRICING[tier];

  if (!options.supabaseUserId) {
    throw new Error("Missing Supabase user ID for CCBill checkout.");
  }

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

    // CCBill passthrough params.
    // Register these in CCBill Admin later for better reporting/consistency:
    //   supabaseUserId
    //   requestedTier
    supabaseUserId: options.supabaseUserId,
    requestedTier: tier,
  });

  if (options.email) {
    params.set("customerEmail", options.email);
  }

  const url = `https://api.ccbill.com/wap-frontflex/flexforms/${CCBILL_CONFIG.flexId}?${params.toString()}`;

  if (import.meta.env.DEV) {
    console.log(`[CCBill] ${tier.toUpperCase()} checkout URL:`, url);
  }

  return url;
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
// but does not support dynamic pricing. We now use top-level FlexForms URLs.
export const CCBILL_WIDGET = {
  scriptSrc: "https://images.ccbill.com/flexforms2/ccbill-widget-live.js",
  silver: {
    className: "CCBillWidget03ff568e-0540-40a0-9271-bb564caa9029_32231",
  },
  gold: {
    className: "PASTE_GOLD_WIDGET_CLASS_HERE",
  },
};