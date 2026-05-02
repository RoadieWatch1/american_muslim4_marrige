import { Info } from 'lucide-react';

export function PaymentMethodsNotice() {
  return (
    <div className="mb-6 max-w-2xl mx-auto rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-900 leading-relaxed">
        We currently accept <span className="font-semibold">Visa</span> cards
        only. Mastercard and other networks are not supported yet.
      </p>
    </div>
  );
}
