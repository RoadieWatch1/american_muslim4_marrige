export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type EmailType =
  | "wali_invitation"
  | "intro_request"
  | "match"
  | "new_message"
  | "new_like";

interface EmailRequest {
  type: EmailType;
  to: string;
  recipientUserId?: string;
  data: {
    womanName?: string;
    waliName?: string;
    requesterName?: string;
    recipientName?: string;
    matchName?: string;

    senderName?: string;
    message?: string;
    loginUrl?: string;

    // new_like
    likerName?: string;
  };
}

const BATCH_WINDOW_MINUTES = 10;
const THROTTLE_MINUTES = 5;
const MAX_PREVIEWS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();
    const { type, to, recipientUserId, data } = body;

    if (!type || !to) {
      throw new Error("Missing required fields: type, to");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─────────────────────────────────────────────────────────────
    // 1) Preferences + digest routing
    // ─────────────────────────────────────────────────────────────
    let notificationFrequency: string | null = null;

    if (recipientUserId) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "email_notifications_enabled, notify_wali_invitations, notify_intro_requests, notify_matches, notify_messages, notification_frequency"
        )
        .eq("id", recipientUserId)
        .single();

      if (error) {
        console.error("Error fetching preferences:", error);
      } else if (profile) {
        notificationFrequency = profile.notification_frequency;

        if (!profile.email_notifications_enabled) {
          return new Response(
            JSON.stringify({
              success: true,
              skipped: true,
              reason: "Email notifications disabled",
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Map each email type to the user's preference column.
        // new_like reuses notify_matches since likes-and-matches are
        // both "someone is interested in you" events.
        const typePreferenceMap: Record<EmailType, keyof typeof profile> = {
          wali_invitation: "notify_wali_invitations",
          intro_request: "notify_intro_requests",
          match: "notify_matches",
          new_message: "notify_messages",
          new_like: "notify_matches",
        };

        const preferenceKey = typePreferenceMap[type];
        if (preferenceKey && profile[preferenceKey] === false) {
          return new Response(
            JSON.stringify({
              success: true,
              skipped: true,
              reason: `${type} notifications disabled`,
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Digest mode: queue for batched delivery later
        if (profile.notification_frequency !== "instant") {
          const { subject, html } = generateEmailContent(type, data);

          const { error: insertError } = await supabase
            .from("pending_notifications")
            .insert({
              user_id: recipientUserId,
              notification_type: type,
              subject,
              content: html,
              metadata: { to, data },
            });

          if (insertError) {
            console.error("Error inserting pending notification:", insertError);
            throw insertError;
          }

          return new Response(
            JSON.stringify({
              success: true,
              queued: true,
              frequency: profile.notification_frequency,
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2) Batching for instant new_message (unchanged)
    // ─────────────────────────────────────────────────────────────
    if (type === "new_message" && recipientUserId) {
      const senderName = (data?.senderName || "someone").trim();
      const loginUrl = data?.loginUrl || "https://your-app.com/messages";

      const { data: inserted, error: insErr } = await supabase
        .from("pending_notifications")
        .insert({
          user_id: recipientUserId,
          notification_type: "new_message",
          subject: `New message from ${senderName}`,
          content: "",
          metadata: { to, data },
        })
        .select("id, created_at")
        .single();

      if (insErr) {
        console.error("Error queueing new_message notification:", insErr);
      } else {
        const throttleSince = new Date(
          Date.now() - THROTTLE_MINUTES * 60 * 1000
        ).toISOString();

        const { data: recentSent, error: recentErr } = await supabase
          .from("pending_notifications")
          .select("id, created_at")
          .eq("user_id", recipientUserId)
          .eq("notification_type", "new_message")
          .eq("is_sent", true)
          .eq("metadata->data->>senderName", senderName)
          .gte("created_at", throttleSince)
          .order("created_at", { ascending: false })
          .limit(1);

        if (recentErr) {
          console.error("Throttle check failed:", recentErr);
        }

        if (recentSent && recentSent.length > 0) {
          return new Response(
            JSON.stringify({
              success: true,
              queued: true,
              batched: true,
              reason: "throttled_recent_email",
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const batchSince = new Date(
          Date.now() - BATCH_WINDOW_MINUTES * 60 * 1000
        ).toISOString();

        const { data: batchRows, error: batchErr } = await supabase
          .from("pending_notifications")
          .select("id, created_at, metadata")
          .eq("user_id", recipientUserId)
          .eq("notification_type", "new_message")
          .eq("is_sent", false)
          .eq("metadata->data->>senderName", senderName)
          .gte("created_at", batchSince)
          .order("created_at", { ascending: true });

        if (batchErr) {
          console.error("Batch select failed:", batchErr);
        } else {
          const count = batchRows?.length || 0;

          if (count > 0) {
            const { subject, html } = generateBatchedNewMessageEmail({
              senderName,
              loginUrl,
              rows: batchRows,
              maxPreviews: MAX_PREVIEWS,
            });

            await sendViaResend({ subject, html, to });

            const ids = batchRows.map((r: any) => r.id);
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
              console.error("Failed to mark batch as sent:", updErr);
            }

            return new Response(
              JSON.stringify({
                success: true,
                sent: true,
                batched: true,
                count,
              }),
              { headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }
      }

      const { subject, html } = generateEmailContent("new_message", data);
      await sendViaResend({ subject, html, to });

      return new Response(JSON.stringify({ success: true, sent: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3) All other instant emails (intro_request / match / wali_invitation / new_like)
    // ─────────────────────────────────────────────────────────────
    const { subject, html } = generateEmailContent(type, data);

    console.log("Sending email", { type, to, recipientUserId, subject });

    await sendViaResend({ subject, html, to });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-notification-email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

/* ─────────────────────────────────────────────────────────────
 * Resend helper
 * ───────────────────────────────────────────────────────────── */
async function sendViaResend(args: { to: string; subject: string; html: string }) {
  const resendApiKey =
    Deno.env.get("RESEND_API_KEY") || Deno.env.get("RESENDAPIKEY");
  const resendDomain = Deno.env.get("RESENDDOMAIN");

  if (!resendApiKey) {
    throw new Error(
      "Resend API key not configured (RESEND_API_KEY or RESENDAPIKEY)"
    );
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

  const resultText = await response.text();
  let result: any = null;
  try {
    result = JSON.parse(resultText);
  } catch {
    // keep as text
  }

  if (!response.ok) {
    console.error("Resend failed", {
      status: response.status,
      statusText: response.statusText,
      result: result ?? resultText,
    });
    throw new Error(result?.message || resultText || "Failed to send email");
  }
}

/* ─────────────────────────────────────────────────────────────
 * Batch email builder for new_message
 * ───────────────────────────────────────────────────────────── */
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
    <p>You have <strong>${count}</strong> unread ${
      count === 1 ? "message" : "messages"
    } from <strong>${senderName}</strong>.</p>

    ${
      shown.length
        ? `<div style="margin:12px 0;padding:12px;border:1px solid #e5e7eb;border-radius:8px;">
            ${shown
              .map((t) => {
                const preview =
                  t.length > 120 ? t.substring(0, 120) + "..." : t;
                return `<p style="margin:0 0 8px 0;color:#374151;"><em>“${escapeHtml(
                  preview
                )}”</em></p>`;
              })
              .join("")}
            ${
              more > 0
                ? `<p style="margin:0;color:#6b7280;font-size:12px;">+ ${more} more</p>`
                : ""
            }
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

/* ─────────────────────────────────────────────────────────────
 * Templates
 * ───────────────────────────────────────────────────────────── */
function generateEmailContent(type: EmailType, data: any) {
  let subject = "";
  let html = "";

  switch (type) {
    case "wali_invitation":
      subject = `${data.womanName} has invited you to be her Wali`;
      html = `
        <h2>Assalamu Alaikum ${data.waliName || "Dear Guardian"},</h2>
        <p>${data.womanName} has invited you to be her wali (guardian) on our Islamic matchmaking platform.</p>
        <p>As a wali, you will be able to:</p>
        <ul>
          <li>Review introduction requests</li>
          <li>Approve or reject potential matches</li>
          <li>Provide guidance throughout the process</li>
        </ul>
        <p>
          <a href="${data.loginUrl || "https://your-app.com"}"
             style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
             Access Wali Console
          </a>
        </p>
        <p>JazakAllah Khair,<br/>The Nikah Team</p>
      `;
      break;

    case "intro_request":
      subject = `New Introduction Request Needs Your Approval`;
      html = `
        <h2>Assalamu Alaikum ${data.waliName || "Dear Guardian"},</h2>
        <p>${data.requesterName} has sent an introduction request to ${data.recipientName}.</p>
        ${data.message ? `<p><strong>Message:</strong> "${data.message}"</p>` : ""}
        <p>Please review this request and provide your approval or rejection.</p>
        <p>
          <a href="${data.loginUrl || "https://your-app.com/intro-requests"}"
             style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
             Review Request
          </a>
        </p>
        <p>JazakAllah Khair,<br/>The Nikah Team</p>
      `;
      break;

    case "match":
      subject = `You have a new match!`;
      html = `
        <h2>Assalamu Alaikum,</h2>
        <p>Great news! You have matched with ${data.matchName}.</p>
        <p>You can now start a conversation and get to know each other better.</p>
        <p>
          <a href="${data.loginUrl || "https://your-app.com/messages"}"
             style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
             View Messages
          </a>
        </p>
        <p>May Allah guide you both,<br/>The Nikah Team</p>
      `;
      break;

    case "new_message": {
      const msg = typeof data.message === "string" ? data.message : "";
      const preview = msg
        ? msg.substring(0, 100) + (msg.length > 100 ? "..." : "")
        : "";
      subject = `New message from ${data.senderName || "someone"}`;
      html = `
        <h2>Assalamu Alaikum,</h2>
        <p>You have received a new message from ${data.senderName || "someone"}.</p>
        ${preview ? `<p><em>"${escapeHtml(preview)}"</em></p>` : ""}
        <p>
          <a href="${data.loginUrl || "https://your-app.com/messages"}"
             style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
             Read Message
          </a>
        </p>
        <p>JazakAllah Khair,<br/>The Nikah Team</p>
      `;
      break;
    }

    case "new_like": {
      const likerName = data.likerName || "Someone";
      subject = `${likerName} liked your profile`;
      html = `
        <h2>Assalamu Alaikum,</h2>
        <p><strong>${escapeHtml(likerName)}</strong> just liked your profile on AM4M.</p>
        <p>Open <em>Who Liked Me</em> to view their profile and like them back if you're interested.</p>
        <p>
          <a href="${data.loginUrl || "https://your-app.com/who-liked-me"}"
             style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
             View Likes
          </a>
        </p>
        <p>JazakAllah Khair,<br/>The Nikah Team</p>
      `;
      break;
    }

    default:
      throw new Error("Invalid email type");
  }

  return { subject, html };
}
