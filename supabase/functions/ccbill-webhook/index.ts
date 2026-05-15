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

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const requestUrl = new URL(req.url);
  const queryParams = Object.fromEntries(requestUrl.searchParams.entries());

  let payload: CCBillPayload = {};

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

    const requestedTier = isPaidTier(requestedTierRaw)
      ? requestedTierRaw
      : null;

    const { error: insertError } = await supabase
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
      });

    if (insertError) {
      console.error("[CCBill Webhook] Failed to insert audit event:", insertError);
      return new Response("Audit insert failed", { status: 500 });
    }

    console.log("[CCBill Webhook] Received event:", {
      eventType,
      eventGroupType,
      clientAccnum,
      clientSubacc,
      supabaseUserId,
      requestedTier,
      subscriptionId,
      transactionId,
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[CCBill Webhook] Unhandled error:", error);
    return new Response("Webhook error", { status: 500 });
  }
});
