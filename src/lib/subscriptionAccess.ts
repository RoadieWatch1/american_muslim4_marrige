export type SubscriptionTier = "free" | "silver" | "gold";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "expired" | string;

export interface SubscriptionProfile {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  subscription_end_date?: string | null;
  subscription_cancel_at_period_end?: boolean | null;
  cancel_at_period_end?: boolean | null;
}

export function normalizeSubscriptionTier(
  tier?: string | null,
): SubscriptionTier {
  const normalized = String(tier ?? "free").toLowerCase();

  if (normalized === "silver") return "silver";
  if (normalized === "gold") return "gold";

  return "free";
}

export function isSubscriptionExpired(
  subscriptionEndDate?: string | null,
  now: Date = new Date(),
): boolean {
  if (!subscriptionEndDate) {
    return false;
  }

  const endDate = new Date(subscriptionEndDate);

  if (Number.isNaN(endDate.getTime())) {
    return true;
  }

  return endDate <= now;
}

export function hasPaidAccess(
  profile?: SubscriptionProfile | null,
  now: Date = new Date(),
): boolean {
  if (!profile) return false;

  const tier = normalizeSubscriptionTier(profile.subscription_tier);
  const status = String(profile.subscription_status ?? "inactive").toLowerCase();

  if (tier === "free") return false;
  if (status !== "active") return false;
  if (isSubscriptionExpired(profile.subscription_end_date, now)) return false;

  return true;
}

export function getActiveSubscriptionTier(
  profile?: SubscriptionProfile | null,
  now: Date = new Date(),
): SubscriptionTier {
  if (!hasPaidAccess(profile, now)) {
    return "free";
  }

  return normalizeSubscriptionTier(profile?.subscription_tier);
}

export function isCancelingAtPeriodEnd(
  profile?: SubscriptionProfile | null,
): boolean {
  return Boolean(
    profile?.subscription_cancel_at_period_end ??
      profile?.cancel_at_period_end ??
      false,
  );
}
