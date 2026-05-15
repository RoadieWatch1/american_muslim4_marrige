import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CCBillPayload = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable.");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EXPECTED_CLIENT_ACCNUM = "955247";
const EXPECTED_CLIENT_SUBACC = "0000";

const ACTIVATING_EVENTS = new Set<string>([
  "NewSaleSuccess",
  "RenewalSuccess",
  "UserReactivation",
]);

const LOG_ONLY_EVENTS = new Set<string>([
  "Cancellation",
  "Expiration",
  "Refund",
  "Chargeback",
  "Void",
]);

function getString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function pickString(payload: CCBillPayload, keys: string[]): string | null {
  for (const key of keys) {
    const value = getString(payload[key]);
    if (value) return value;
  }

  return null;
}

function isPaidTier(value: string | null): value is "silver" | "gold" {
  return value === "silver" || value === "gold";
}

function parseDateToIso(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

async function parseRequestBody(req: Request): Promise<CCBillPayload> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return await req.json();
  }

  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  const params = new URLSearchParams(text);
  return Object.fromEntries(params.entries());
}

async function markProcessed(auditId: string): Promise<void> {
  const { error } = await supabase
    .from("ccbill_webhook_events")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq("id", auditId);

  if (error) {
    console.error("[CCBill Webhook] Failed to mark processed:", error);
  }
}

async function markProcessingError(
  auditId: string,
  message: string,
): Promise<void> {
  console.warn(`[CCBill Webhook] processing_error for ${auditId}: ${message}`);
  const { error } = await supabase
    .from("ccbill_webhook_events")
    .update({
      processing_error: message,
      processed_at: new Date().toISOString(),
    })
    .eq("id", auditId);

  if (error) {
    console.error("[CCBill Webhook] Failed to write processing_error:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const requestUrl = new URL(req.url);
  const queryParams = Object.fromEntries(requestUrl.searchParams.entries());

  let payload: CCBillPayload = {};
  let auditId: string | null = null;

  try {
    payload = await parseRequestBody(req);

    const eventType =
      pickString(payload, ["eventType"]) ?? getString(queryParams.eventType);

    const eventGroupType =
      pickString(payload, ["eventGroupType"]) ??
      getString(queryParams.eventGroupType);

    const clientAccnum =
      pickString(payload, ["clientAccnum"]) ??
      getString(queryParams.clientAccnum);

    const clientSubacc =
      pickString(payload, ["clientSubacc"]) ??
      getString(queryParams.clientSubacc);

    const supabaseUserId = pickString(payload, [
      "X-supabaseUserId",
      "supabaseUserId",
      "x-supabaseUserId",
    ]);

    const requestedTierRaw = pickString(payload, [
      "X-requestedTier",
      "requestedTier",
      "x-requestedTier",
    ]);

    const customerEmail = pickString(payload, [
      "X-customerEmail",
      "customerEmail",
      "email",
      "customer_email",
    ]);

    const subscriptionId = pickString(payload, [
      "subscriptionId",
      "subscription_id",
    ]);

    const transactionId = pickString(payload, [
      "transactionId",
      "transaction_id",
      "transaction",
    ]);

    const nextRenewalDateRaw = pickString(payload, [
      "nextRenewalDate",
      "next_renewal_date",
    ]);

    const paymentAccount = pickString(payload, [
      "paymentAccount",
      "payment_account",
    ]);

    const requestedTier = isPaidTier(requestedTierRaw)
      ? requestedTierRaw
      : null;

    const { data: insertedEvent, error: insertError } = await supabase
      .from("ccbill_webhook_events")
      .insert({
        event_type: eventType,
        event_group_type: eventGroupType,
        client_accnum: clientAccnum,
        client_subacc: clientSubacc,
        subscription_id: subscriptionId,
        transaction_id: transactionId,
        supabase_user_id: supabaseUserId,
        requested_tier: requestedTier,
        customer_email: customerEmail,
        raw_payload: payload,
        raw_query: queryParams,
        processed: false,
      })
      .select("id")
      .single();

    if (insertError || !insertedEvent) {
      console.error(
        "[CCBill Webhook] Failed to insert audit event:",
        insertError,
      );
      return new Response("Audit insert failed", { status: 500 });
    }

    auditId = insertedEvent.id as string;

    console.log("[CCBill Webhook] Received event:", {
      auditId,
      eventType,
      eventGroupType,
      clientAccnum,
      clientSubacc,
      supabaseUserId,
      requestedTier,
      subscriptionId,
      transactionId,
    });

    if (clientAccnum !== EXPECTED_CLIENT_ACCNUM) {
      await markProcessingError(
        auditId,
        `Unexpected clientAccnum: ${clientAccnum ?? "(missing)"}`,
      );
      return new Response("OK", { status: 200 });
    }

    if (clientSubacc !== EXPECTED_CLIENT_SUBACC) {
      await markProcessingError(
        auditId,
        `Unexpected clientSubacc: ${clientSubacc ?? "(missing)"}`,
      );
      return new Response("OK", { status: 200 });
    }

    if (!eventType) {
      await markProcessingError(auditId, "Missing eventType");
      return new Response("OK", { status: 200 });
    }

    if (LOG_ONLY_EVENTS.has(eventType)) {
      console.log(
        `[CCBill Webhook] Log-only event ${eventType} for user ${supabaseUserId ?? "(unknown)"}; downgrade not implemented yet.`,
      );
      await markProcessed(auditId);
      return new Response("OK", { status: 200 });
    }

    if (ACTIVATING_EVENTS.has(eventType)) {
      if (!supabaseUserId) {
        await markProcessingError(
          auditId,
          "Missing supabaseUserId for activating event",
        );
        return new Response("OK", { status: 200 });
      }

      if (!requestedTier) {
        await markProcessingError(
          auditId,
          `Invalid or missing requestedTier: ${requestedTierRaw ?? "(missing)"}`,
        );
        return new Response("OK", { status: 200 });
      }

      const nowIso = new Date().toISOString();

      const profileUpdate: Record<string, unknown> = {
        subscription_tier: requestedTier,
        subscription_status: "active",
        subscription_cancel_at_period_end: false,
        ccbill_subscription_id: subscriptionId,
        ccbill_transaction_id: transactionId,
        ccbill_last_event_at: nowIso,
        updated_at: nowIso,
      };

      if (paymentAccount) {
        profileUpdate.ccbill_payment_account = paymentAccount;
      }

      const parsedRenewal = parseDateToIso(nextRenewalDateRaw);
      if (parsedRenewal) {
        profileUpdate.subscription_end_date = parsedRenewal;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", supabaseUserId);

      if (profileError) {
        await markProcessingError(
          auditId,
          `Profile update failed: ${profileError.message}`,
        );
        return new Response("OK", { status: 200 });
      }

      await markProcessed(auditId);
      console.log(
        `[CCBill Webhook] Profile ${supabaseUserId} upgraded to ${requestedTier}.`,
      );
      return new Response("OK", { status: 200 });
    }

    await markProcessingError(auditId, `Unhandled event type: ${eventType}`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CCBill Webhook] Unhandled error:", error);

    if (auditId) {
      await markProcessingError(auditId, `Unhandled error: ${message}`);
      return new Response("OK", { status: 200 });
    }

    return new Response("Webhook error", { status: 500 });
  }
});
