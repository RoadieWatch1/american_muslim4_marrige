// @ts-nocheck
// Edge Function: send-email-otp (single source of truth for 6-digit codes)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- Resolve envs from either reserved or custom names (yours without underscores) ----
const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASEURL") || "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASESERVICEROLEKEY") ||
  "";
const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY") || Deno.env.get("RESENDAPIKEY") || "";
const RESEND_DOMAIN =
  Deno.env.get("RESEND_DOMAIN") || Deno.env.get("RESENDDOMAIN") || "americanmuslim4marriage.com";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---- CORS ----
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Helpers ----
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });

const makeCode = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Server env not configured (SUPABASE_URL/SERVICE_ROLE_KEY)" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim();
    const userId = String(body?.userId ?? "").trim();
    if (!email) return json({ success: false, error: "Email required" }, 400);
    if (!userId) return json({ success: false, error: "userId required" }, 400);

    // Generate + store (support BOTH columns: token and code, so your UI works either way)
    const code = makeCode();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Clean previous for this user (optional but nice)
    await supabase.from("email_verification_tokens").delete().eq("user_id", userId);

    const { error: insertErr } = await supabase.from("email_verification_tokens").insert({
      user_id: userId,
      email,
      token: code,     // <- preferred, matches AuthContext.verifyEmailCode() that uses 'token'
      code,            // <- also write 'code' for backward compatibility
      expires_at,
      used_at: null,
    });
    if (insertErr) return json({ success: false, error: `DB insert failed: ${insertErr.message}` }, 500);

    // Email via Resend (optional — if key missing, still succeed because code is stored)
    if (RESEND_API_KEY) {
      const subject = "Your verification code";
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Verify your email</h2>
          <p>Your 6-digit code is:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:4px">${code}</div>
          <p>This code expires in 10 minutes.</p>
        </div>
      `;
      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `AM4M <noreply@${RESEND_DOMAIN}>`,
          to: [email],
          subject,
          html,
        }),
      });

      if (!mailRes.ok) {
        const text = await mailRes.text().catch(() => "");
        // Return 200 so UI can still proceed (code is in DB)
        return json({ success: true, emailWarning: `Email send failed: ${text || mailRes.status}` }, 200);
      }
    }

    return json({ success: true }, 200);
  } catch (e) {
    return json({ success: false, error: e?.message || "Unknown error" }, 500);
  }
});
