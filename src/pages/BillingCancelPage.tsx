// src/pages/BillingCancelPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";

export default function BillingCancelPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Payment cancelled",
      description: "No charges were made. You can try again anytime.",
    });
  }, [toast]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Payment cancelled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You cancelled the checkout. If you still want to upgrade, you can try again.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => navigate("/pricing")}>Back to Pricing</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
