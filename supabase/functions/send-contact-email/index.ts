export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function escapeHtml(s: string) {
  return (s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ✅ IMPORTANT: use YOUR existing secret name exactly
    const RESEND_API_KEY = Deno.env.get("RESENDAPIKEY");

    // Optional secrets (you added these)
    const FROM_EMAIL =
      Deno.env.get("CONTACT_FROM_EMAIL") ||
      `support@${Deno.env.get("RESENDDOMAIN") || "americanmuslim4marriage.com"}`;

    const TO_EMAIL =
      Deno.env.get("CONTACT_TO_EMAIL") ||
      `support@${Deno.env.get("RESENDDOMAIN") || "americanmuslim4marriage.com"}`;

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing RESENDAPIKEY secret" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();

    const name = (body?.name ?? "").toString().trim();
    const email = (body?.email ?? "").toString().trim();
    const message = (body?.message ?? "").toString().trim();
    const page_url = (body?.page_url ?? "").toString().trim();
    const user_agent = (body?.user_agent ?? "").toString().trim();
    const user_id = (body?.user_id ?? "").toString().trim();

    if (!email || !message) {
      return new Response(
        JSON.stringify({ error: "email and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const subject = `AM4M Contact Form: ${name ? name : "New Message"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5">
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${escapeHtml(name || "N/A")}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>User ID:</b> ${escapeHtml(user_id || "N/A")}</p>
        <p><b>Page:</b> ${escapeHtml(page_url || "N/A")}</p>
        <p><b>User Agent:</b> ${escapeHtml(user_agent || "N/A")}</p>
        <hr />
        <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
      </div>
    `;

    // Resend API call
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email, // so support can reply directly
        subject,
        html,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "Resend failed", details: data }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
