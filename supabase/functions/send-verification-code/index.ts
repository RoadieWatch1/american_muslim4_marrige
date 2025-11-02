// @ts-nocheck
/**
 * Edge Function: send-verification-code
 * - Generates a 6-digit OTP
 * - Upserts into email_verification_tokens (token column)
 * - Sends email via Resend
 * - CORS + clear JSON errors
 */

import { createClient } from "@supabase/supabase-js";

// ---- CORS ----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ---- ENV ----
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "Nikah Connect <noreply@nikahconnect.com>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Deno’s built-in HTTP server
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Missing server environment variables." }, 500);
    }

    const payload = await req.json().catch(() => ({}));
    const email = String(payload?.email ?? "").trim();
    const userId = String(payload?.userId ?? "").trim();

    if (!email || !userId) {
      return json({ success: false, error: "email and userId are required" }, 400);
    }

    // Create Supabase (service role) client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate a 6-digit numeric code; 10 min expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Upsert token row keyed by user_id
    const { error: upsertErr } = await supabase
      .from("email_verification_tokens")
      .upsert(
        {
          user_id: userId,
          token: code,          // matches frontend verifyEmailCode() which checks 'token'
          expires_at: expiresAtIso,
          used_at: null,
        },
        { onConflict: "user_id" },
      );

    if (upsertErr) {
      return json({ success: false, error: `DB upsert failed: ${upsertErr.message}` }, 500);
    }

    // Compose email
    const subject = "Your Verification Code - Nikah Connect";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0d9488; margin: 0;">Nikah Connect</h1>
          <p style="color: #666; margin-top: 5px;">Islamic Matchmaking Platform</p>
        </div>
        <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #666; margin-bottom: 30px;">Enter this code to complete your registration:</p>
          <div style="background: white; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; color: #0d9488; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>If you didn't request this code, please ignore this email.</p>
          <p style="margin-top: 20px;">© ${new Date().getFullYear()} Nikah Connect. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [email], subject, html }),
    });

    if (!resendRes.ok) {
      const text = await resendRes.text().catch(() => "");
      return json({ success: false, error: `Email send failed: ${text || resendRes.status}` }, 502);
    }

    return json({ success: true, message: "Verification code sent to your email" }, 200);
  } catch (e) {
    const msg = (e as Error)?.message ?? "Unknown error";
    return json({ success: false, error: msg }, 500);
  }
});
