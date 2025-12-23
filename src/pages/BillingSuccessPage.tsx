import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const sessionId = params.get("session_id");

    if (sessionId) {
      toast.success("Subscription activated successfully 🎉");
      refreshProfile?.();
    }

    // optional auto-redirect after 2 seconds
    setTimeout(() => {
      navigate("/billing");
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Payment successful</h1>
        <p className="text-gray-600">Redirecting to dashboard…</p>
      </div>
    </div>
  );
}
