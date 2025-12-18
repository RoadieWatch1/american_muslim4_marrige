// src/lib/notifications.ts
import { supabase } from "./supabase";

type EmailType = "wali_invitation" | "intro_request" | "match" | "new_message";

type NotificationData = {
  userId: string; // recipient user id
  type: EmailType;
  toEmail: string; // recipient email
  data: Record<string, any>; // payload used by the template
};

export async function sendNotificationEmail(payload: NotificationData) {
  const { userId, type, toEmail, data } = payload;

  const { error } = await supabase.functions.invoke("send-notification-email", {
    body: {
      type,
      to: toEmail,
      recipientUserId: userId,
      data: {
        ...data,
        loginUrl: data.loginUrl || `${window.location.origin}/dashboard`,
      },
    },
  });

  if (error) throw error;
}

/* ──────────────────────────────────────────────────────────────
 * Offline detection (based on profiles.last_seen_at heartbeat)
 * ────────────────────────────────────────────────────────────── */

const OFFLINE_AFTER_MINUTES = 2; // adjust later (e.g. 2–5 mins)

function isOlderThanMinutes(iso: string | null | undefined, minutes: number) {
  if (!iso) return true; // if missing, assume offline
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > minutes * 60 * 1000;
}

async function shouldEmailNewMessage(recipientUserId: string) {
  // If user recently active -> do NOT email
  const { data, error } = await supabase
    .from("profiles")
    .select("last_seen_at")
    .eq("id", recipientUserId)
    .maybeSingle();

  if (error) {
    console.warn("shouldEmailNewMessage: failed to load last_seen_at:", error.message);
    // safest behavior: still send email (so you don't miss notifications)
    return true;
  }

  return isOlderThanMinutes(data?.last_seen_at, OFFLINE_AFTER_MINUTES);
}

/** Helpers */

export async function notifyNewMatch(params: {
  userId: string;
  email: string;
  matchName: string;
}) {
  return sendNotificationEmail({
    userId: params.userId,
    type: "match",
    toEmail: params.email,
    data: {
      matchName: params.matchName,
      loginUrl: `${window.location.origin}/messages`,
    },
  });
}

export async function notifyNewMessage(params: {
  userId: string;
  email: string;
  senderName: string;
  message: string; // full or preview, Edge template already trims
}) {
  // ✅ only email if recipient looks offline
  const okToEmail = await shouldEmailNewMessage(params.userId);
  if (!okToEmail) return;

  return sendNotificationEmail({
    userId: params.userId,
    type: "new_message",
    toEmail: params.email,
    data: {
      senderName: params.senderName,
      message: params.message,
      loginUrl: `${window.location.origin}/messages`,
    },
  });
}

export async function notifyIntroRequest(params: {
  userId: string; // recipient
  email: string;
  waliName?: string;
  requesterName: string;
  recipientName: string;
  message?: string;
}) {
  return sendNotificationEmail({
    userId: params.userId,
    type: "intro_request",
    toEmail: params.email,
    data: {
      waliName: params.waliName,
      requesterName: params.requesterName,
      recipientName: params.recipientName,
      message: params.message,
      loginUrl: `${window.location.origin}/wali-console`,
    },
  });
}

export async function notifyWaliInvitation(params: {
  userId: string; // wali user id if exists
  email: string;
  womanName: string;
  waliName?: string;
}) {
  return sendNotificationEmail({
    userId: params.userId,
    type: "wali_invitation",
    toEmail: params.email,
    data: {
      womanName: params.womanName,
      waliName: params.waliName || "Guardian",
      loginUrl: `${window.location.origin}/wali-console`,
    },
  });
}




// // src/lib/notifications.ts
// import { supabase } from "./supabase";

// type EmailType = "wali_invitation" | "intro_request" | "match" | "new_message";

// type NotificationData = {
//   userId: string;               // recipient user id
//   type: EmailType;
//   toEmail: string;              // recipient email
//   data: Record<string, any>;    // payload used by the template
// };

// export async function sendNotificationEmail(payload: NotificationData) {
//   const { userId, type, toEmail, data } = payload;

//   const { error } = await supabase.functions.invoke("send-notification-email", {
//     body: {
//       type,
//       to: toEmail,
//       recipientUserId: userId,
//       data: {
//         ...data,
//         loginUrl: data.loginUrl || `${window.location.origin}/dashboard`,
//       },
//     },
//   });

//   if (error) throw error;
// }

// /** Helpers */

// export async function notifyNewMatch(params: {
//   userId: string;
//   email: string;
//   matchName: string;
// }) {
//   return sendNotificationEmail({
//     userId: params.userId,
//     type: "match",
//     toEmail: params.email,
//     data: {
//       matchName: params.matchName,
//       loginUrl: `${window.location.origin}/messages`,
//     },
//   });
// }

// export async function notifyNewMessage(params: {
//   userId: string;
//   email: string;
//   senderName: string;
//   message: string; // full or preview, Edge template already trims
// }) {
//   return sendNotificationEmail({
//     userId: params.userId,
//     type: "new_message",
//     toEmail: params.email,
//     data: {
//       senderName: params.senderName,
//       message: params.message,
//       loginUrl: `${window.location.origin}/messages`,
//     },
//   });
// }

// export async function notifyIntroRequest(params: {
//   userId: string; // recipient
//   email: string;
//   waliName?: string;
//   requesterName: string;
//   recipientName: string;
//   message?: string;
// }) {
//   return sendNotificationEmail({
//     userId: params.userId,
//     type: "intro_request",
//     toEmail: params.email,
//     data: {
//       waliName: params.waliName,
//       requesterName: params.requesterName,
//       recipientName: params.recipientName,
//       message: params.message,
//       loginUrl: `${window.location.origin}/wali-console`,
//     },
//   });
// }

// export async function notifyWaliInvitation(params: {
//   userId: string; // wali user id if exists (or skip recipientUserId if wali not a user yet)
//   email: string;
//   womanName: string;
//   waliName?: string;
// }) {
//   return sendNotificationEmail({
//     userId: params.userId,
//     type: "wali_invitation",
//     toEmail: params.email,
//     data: {
//       womanName: params.womanName,
//       waliName: params.waliName || "Guardian",
//       loginUrl: `${window.location.origin}/wali-console`,
//     },
//   });
// }
