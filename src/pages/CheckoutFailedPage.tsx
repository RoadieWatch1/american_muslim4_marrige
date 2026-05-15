import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckoutFailedPage() {
  const { user } = useAuth();
  const toastedRef = useRef(false);

  useEffect(() => {
    if (toastedRef.current) return;
    toastedRef.current = true;
    toast.error("Payment was not completed");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Payment was not completed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't process your payment. No charges were made. You can try
          again, or come back to it later.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button asChild>
            <Link to="/pricing">Back to Pricing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={user ? "/dashboard" : "/"}>
              {user ? "Go to Dashboard" : "Sign In"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
