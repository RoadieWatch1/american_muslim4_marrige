export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const BATCH_AFTER_MINUTES = 2;  // only flush messages older than this (prevents sending too fast)
const MAX_GROUPS_PER_RUN = 50;  // safety limit
const MAX_PREVIEWS = 5;

Deno.serve(async (req) => {
  // allow manual invoke too
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cutoff = new Date(Date.now() - BATCH_AFTER_MINUTES * 60 * 1000).toISOString();

    // 1) Pull candidate unsent new_message notifications (older than cutoff)
    // NOTE: we fetch a bounded number per run, then group in-memory
    const { data: rows, error } = await supabase
      .from("pending_notifications")
      .select("id, user_id, created_at, metadata")
      .eq("notification_type", "new_message")
      .eq("is_sent", false)
      .lte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      return json({ success: true, flushed: 0, reason: "no_rows" });
    }

    // 2) Group by (user_id + senderName)
    type Row = any;
    const groups = new Map<string, Row[]>();

    for (const r of rows) {
      const senderName = (r?.metadata?.data?.senderName || "someone").toString().trim();
      const key = `${r.user_id}::${senderName}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    const groupEntries = Array.from(groups.entries()).slice(0, MAX_GROUPS_PER_RUN);

    let flushed = 0;

    for (const [key, groupRows] of groupEntries) {
      const [userId, senderName] = key.split("::");

      // 3) Fetch recipient email + prefs (only send if instant + messages enabled)
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, email, email_notifications_enabled, notify_messages, notification_frequency")
        .eq("id", userId)
        .single();

      if (profErr) {
        console.error("profile load failed", profErr);
        continue;
      }

      if (!prof?.email) continue;
      if (!prof.email_notifications_enabled) continue;
      if (!prof.notify_messages) continue;
      if ((prof.notification_frequency || "instant") !== "instant") {
        // if user is digest mode, leave them to the digest sender
        continue;
      }

      const loginUrl =
        groupRows?.[groupRows.length - 1]?.metadata?.data?.loginUrl ||
        "https://your-app.com/messages";

      // 4) Build batched email
      const { subject, html } = generateBatchedNewMessageEmail({
        senderName,
        loginUrl,
        rows: groupRows,
        maxPreviews: MAX_PREVIEWS,
      });

      // 5) Send email
      await sendViaResend({ to: prof.email, subject, html });

      // 6) Mark rows as sent
      const ids = groupRows.map((r: any) => r.id);
      const { error: updErr } = await supabase
        .from("pending_notifications")
        .update({
          is_sent: true,
          sent_at: new Date().toISOString(),
          subject,
          content: html,
        })
        .in("id", ids);

      if (updErr) {
        console.error("failed to mark sent", updErr);
      } else {
        flushed += ids.length;
      }
    }

    return json({ success: true, flushed, groups: groupEntries.length });
  } catch (e: any) {
    console.error("flush-pending-new-messages error:", e);
    return json({ success: false, error: e?.message || String(e) }, 400);
  }
});

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function sendViaResend(args: { to: string; subject: string; html: string }) {
  const resendApiKey =
    Deno.env.get("RESEND_API_KEY") || Deno.env.get("RESENDAPIKEY");
  const resendDomain = Deno.env.get("RESENDDOMAIN");

  if (!resendApiKey) {
    throw new Error("Resend API key not configured (RESEND_API_KEY or RESENDAPIKEY)");
  }

  const from = resendDomain
    ? `Nikah Platform <noreply@${resendDomain}>`
    : "Nikah Platform <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  const txt = await response.text();
  let parsed: any = null;
  try { parsed = JSON.parse(txt); } catch {}

  if (!response.ok) {
    console.error("Resend failed", { status: response.status, txt: parsed ?? txt });
    throw new Error(parsed?.message || txt || "Failed to send email");
  }
}

function generateBatchedNewMessageEmail(opts: {
  senderName: string;
  loginUrl: string;
  rows: any[];
  maxPreviews: number;
}) {
  const { senderName, loginUrl, rows, maxPreviews } = opts;
  const count = rows.length;

  const previews: string[] = [];
  for (const r of rows) {
    const msg = r?.metadata?.data?.message;
    if (typeof msg === "string" && msg.trim()) previews.push(msg.trim());
  }

  const shown = previews.slice(-maxPreviews);
  const more = Math.max(0, count - shown.length);

  const subject =
    count === 1
      ? `New message from ${senderName}`
      : `You have ${count} unread messages from ${senderName}`;

  const html = `
    <h2>Assalamu Alaikum,</h2>
    <p>You have <strong>${count}</strong> unread ${count === 1 ? "message" : "messages"} from <strong>${escapeHtml(senderName)}</strong>.</p>

    ${
      shown.length
        ? `<div style="margin:12px 0;padding:12px;border:1px solid #e5e7eb;border-radius:8px;">
            ${shown
              .map((t) => {
                const preview = t.length > 120 ? t.substring(0, 120) + "..." : t;
                return `<p style="margin:0 0 8px 0;color:#374151;"><em>“${escapeHtml(preview)}”</em></p>`;
              })
              .join("")}
            ${more > 0 ? `<p style="margin:0;color:#6b7280;font-size:12px;">+ ${more} more</p>` : ""}
          </div>`
        : ""
    }

    <p>
      <a href="${loginUrl}"
         style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:8px;">
         Open Messages
      </a>
    </p>
    <p>JazakAllah Khair,<br/>The Nikah Team</p>
  `;

  return { subject, html };
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
