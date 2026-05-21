// supabase/functions/delete-account/index.ts
//
// Permanently deletes the caller's AM4M account.
//
// Flow:
//   1. Authenticate the caller via their JWT.
//   2. Block the deletion if they still have an active subscription that is
//      NOT scheduled to cancel at period end. Direct them to cancel first.
//   3. Best-effort cleanup of objects in the `profile-media` bucket under
//      `<user_id>/`. Storage failures are logged and ignored — they must
//      never block the account deletion itself.
//   4. supabaseAdmin.auth.admin.deleteUser(user.id). Database CASCADE / SET
//      NULL rules (see migration 20260521000000_account_lifecycle.sql)
//      handle the rest:
//        - likes / matches (and their messages) / intro_requests / media /
//          communication_boundaries / wali_links → deleted
//        - wali_activity_logs / reported_profiles → identity nulled,
//          row retained for moderation/audit
//
// Response shape mirrors `cancel-subscription` for client-side consistency.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STORAGE_BUCKET = "profile-media";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Missing SUPABASE_* env vars");
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing Authorization Bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Resolve caller
    const supabaseAuthed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseAuthed.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = userData.user.id;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Subscription guard
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("subscription_status, subscription_cancel_at_period_end, subscription_end_date")
      .eq("id", userId)
      .maybeSingle();

    if (pErr) throw pErr;

    const isSubActive = profile?.subscription_status === "active";
    const isCancelScheduled = profile?.subscription_cancel_at_period_end === true;

    if (isSubActive && !isCancelScheduled) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "cancel_subscription_first",
          subscription_end_date: profile?.subscription_end_date ?? null,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Best-effort storage cleanup. Never blocks deletion.
    try {
      const { data: objects, error: listErr } = await supabaseAdmin
        .storage
        .from(STORAGE_BUCKET)
        .list(userId, { limit: 1000 });

      if (listErr) {
        console.error("storage.list failed:", listErr.message);
      } else if (objects && objects.length > 0) {
        const paths = objects.map((o) => `${userId}/${o.name}`);
        const { error: removeErr } = await supabaseAdmin
          .storage
          .from(STORAGE_BUCKET)
          .remove(paths);
        if (removeErr) {
          console.error("storage.remove failed:", removeErr.message, paths);
        }
      }
    } catch (storageEx) {
      console.error("storage cleanup threw:", (storageEx as Error).message);
    }

    // 4. Delete the auth user. DB cascade + set-null rules fan out from here.
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      throw new Error(`auth.admin.deleteUser failed: ${deleteErr.message}`);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
