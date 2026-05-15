import { AlertTriangle } from 'lucide-react';

export function PaymentMethodsNotice() {
  return (
    <div className="mb-8 max-w-2xl mx-auto rounded-lg border-2 border-amber-400 bg-amber-100 px-5 py-4 flex items-start gap-3 shadow-sm">
      <AlertTriangle className="h-6 w-6 text-amber-700 flex-shrink-0 mt-0.5" />
      <div className="text-base text-amber-900 leading-relaxed font-semibold space-y-2">
        <p>
          We currently accept <span className="font-extrabold underline">Visa</span> cards only.
          Mastercard and other networks are <span className="font-extrabold">not supported yet</span>.
        </p>
        <p>
          <span className="font-extrabold">Tap your plan again below</span> to confirm you'll
          pay with a Visa card and continue to secure checkout.
        </p>
      </div>
    </div>
  );
}
