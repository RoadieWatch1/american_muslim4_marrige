import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckoutSuccessPage() {
  const { user, refreshProfile } = useAuth();
  const refreshedRef = useRef(false);

  useEffect(() => {
    if (refreshedRef.current) return;
    refreshedRef.current = true;

    toast.success("Payment successful — activating your account…");

    if (user) {
      refreshProfile?.().catch(() => {
        // non-fatal: webhook will still upgrade the profile server-side
      });
    }
  }, [user, refreshProfile]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Payment successful</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Thank you — your payment went through. Your account is being
          activated now. If you don't see your new plan within a minute,
          refresh the page or sign back in.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {user ? (
            <>
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/billing">View Billing</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link to="/">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/pricing">View Plans</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
