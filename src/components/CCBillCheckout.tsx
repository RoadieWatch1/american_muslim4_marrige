import { useState } from "react";
import { buildCheckoutUrl, type PaidTier } from "@/lib/ccbill";

interface CCBillCheckoutProps {
  tier: PaidTier;
}

/**
 * Embeds the CCBill FlexForms checkout inside an iframe.
 *
 * This uses dynamic pricing — the plan price is encoded in the URL params,
 * both Silver and Gold route through subaccount 0000 (recurring).
 */
export default function CCBillCheckout({ tier }: CCBillCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const checkoutUrl = buildCheckoutUrl(tier);

  return (
    <div style={{ minHeight: 400 }}>
      {loading && !error && (
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          Loading payment form...
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-8 text-red-500 text-sm gap-2">
          <p>Failed to load payment form.</p>
          <button
            onClick={() => { setError(false); setLoading(true); }}
            className="text-teal-600 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}
      <iframe
        src={checkoutUrl}
        title={`CCBill ${tier} checkout`}
        style={{
          width: "100%",
          minHeight: 450,
          border: "none",
          display: error ? "none" : "block",
        }}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        allow="payment"
      />
    </div>
  );
}
