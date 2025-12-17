// supabase/functions/send-wali-invite/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type WaliLinkRow = {
  id: string;
  ward_user_id: string | null;
  wali_email: string | null;
  wali_phone: string | null;
  status: string | null;
  invite_token: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SUPABASEURL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASESERVICEROLEKEY") ??
  "";
const RESEND_API_KEY =
  Deno.env.get("RESENDAPIKEY") ?? Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_DOMAIN =
  Deno.env.get("RESENDDOMAIN") ?? Deno.env.get("RESEND_DOMAIN") ?? "";
const APP_BASE_URL =
  Deno.env.get("APP_BASE_URL") ?? "https://www.americanmuslim4marriage.com";

// ─────────────────────────────────────────────
// CORS headers (allow your frontend origin)
// ─────────────────────────────────────────────
const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*", // or set to "http://localhost:8080" + production URL
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY || !RESEND_DOMAIN) {
    console.error("Missing RESENDAPIKEY / RESENDDOMAIN secrets");
    throw new Error("Email not configured");
  }

  const from = `American Muslim 4 Marriage <no-reply@${RESEND_DOMAIN}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error", res.status, text);
    throw new Error(`Failed to send email: ${res.status}`);
  }
}

serve(async (req: Request) => {
  // ─────────────────────────────────────
  // Handle CORS preflight
  // ─────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = (await req.json()) as { wali_link_id?: string };
    const wali_link_id = body.wali_link_id;

    if (!wali_link_id) {
      return new Response(
        JSON.stringify({ error: "Missing wali_link_id in body" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 1) Fetch wali_links row
    const { data: link, error: linkError } = await supabaseAdmin
      .from("wali_links")
      .select("*")
      .eq("id", wali_link_id)
      .single<WaliLinkRow>();

    if (linkError || !link) {
      console.error("Could not find wali_links row", linkError);
      return new Response(
        JSON.stringify({ error: "Wali link not found" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!link.wali_email || !link.invite_token) {
      return new Response(
        JSON.stringify({
          error: "wali_email or invite_token is missing on wali_links row",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 2) Optional: load ward profile to personalize email
    let wardName = "your relative";
    if (link.ward_user_id) {
      const { data: wardProfile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", link.ward_user_id)
        .maybeSingle<ProfileRow>();

      if (wardProfile?.first_name) {
        wardName = wardProfile.first_name;
        if (wardProfile.last_name) {
          wardName += ` ${wardProfile.last_name}`;
        }
      }
    }

    // 3) Build invite URL
    const inviteUrl = `${APP_BASE_URL}/wali-invite?token=${link.invite_token}`;

    // 4) Email content
    const subject =
      "You’ve been invited as a wali on American Muslim 4 Marriage";

    const html = `
      <p>Assalamu alaikum,</p>
      <p>
        You’ve been invited to act as a <strong>wali</strong> for
        <strong>${wardName}</strong> on American Muslim 4 Marriage.
      </p>
      <p>
        As a wali, you’ll be able to review and approve introduction requests
        and help support them in the marriage process.
      </p>
      <p>
        To get started, please click the button below to create your wali
        account or log in:
      </p>
      <p>
        <a href="${inviteUrl}"
           style="
             display:inline-block;
             padding:10px 18px;
             background:#4f46e5;
             color:#ffffff;
             text-decoration:none;
             border-radius:6px;
             font-weight:600;
           ">
          Open Wali Invitation
        </a>
      </p>
      <p>
        Or copy and paste this link into your browser:<br/>
        <a href="${inviteUrl}">${inviteUrl}</a>
      </p>
      <p>
        JazakAllahu khairan,<br/>
        American Muslim 4 Marriage
      </p>
    `;

    // 5) Send email via Resend
    await sendEmail({
      to: link.wali_email,
      subject,
      html,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error("send-wali-invite error", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
