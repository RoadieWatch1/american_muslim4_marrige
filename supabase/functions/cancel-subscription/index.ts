import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Missing SUPABASE_* env vars");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get logged-in user (RLS-safe)
    const supabaseAuthed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseAuthed.auth.getUser();
    if (userErr || !userData?.user) throw new Error("Unauthorized");
    const user = userData.user;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read subscription from profiles
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr) throw pErr;
    const subId = (profile?.stripe_subscription_id as string | null) ?? null;

    if (!subId) {
      return new Response(JSON.stringify({ error: "No active Stripe subscription found." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Schedule cancel at period end (user keeps access)
    const updated = await stripe.subscriptions.update(subId, {
      cancel_at_period_end: true,
    });

    const endDateIso = updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null;

    // Update profile (still active until end date)
    const { error: uErr } = await supabaseAdmin
      .from("profiles")
      .update({
        cancel_at_period_end: true,
        subscription_end_date: endDateIso,
        // keep status active while period is active
        subscription_status: updated.status === "active" || updated.status === "trialing" ? "active" : updated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (uErr) throw uErr;

    return new Response(
      JSON.stringify({
        ok: true,
        cancel_at_period_end: true,
        current_period_end: endDateIso,
        stripe_status: updated.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
