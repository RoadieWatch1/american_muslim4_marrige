import { supabase } from "@/lib/supabase";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export async function startCheckout(tier: "silver" | "gold") {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${FUNCTIONS_URL}/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tier }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to create checkout session");

  window.location.href = json.url;
}
