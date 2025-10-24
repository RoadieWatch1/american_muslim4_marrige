import { supabase } from './supabase';

export type SubscriptionTier = 'basic' | 'premium' | 'elite';

export type Feature = 
  | 'unlimited_matches'
  | 'priority_visibility'
  | 'profile_boost'
  | 'vip_support'
  | 'advanced_filters'
  | 'see_who_liked'
  | 'unlimited_rewinds'
  | 'daily_matches';

export interface SubscriptionFeatures {
  tier: SubscriptionTier;
  features: {
    unlimitedMatches: boolean;
    priorityVisibility: boolean;
    profileBoost: boolean;
    vipSupport: boolean;
    advancedFilters: boolean;
    seeWhoLiked: boolean;
    unlimitedRewinds: boolean;
    dailyMatchLimit: number;
  };
}

export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures['features']> = {
  basic: {
    unlimitedMatches: false,
    priorityVisibility: false,
    profileBoost: false,
    vipSupport: false,
    advancedFilters: false,
    seeWhoLiked: false,
    unlimitedRewinds: false,
    dailyMatchLimit: 3
  },
  premium: {
    unlimitedMatches: true,
    priorityVisibility: true,
    profileBoost: false,
    vipSupport: false,
    advancedFilters: true,
    seeWhoLiked: true,
    unlimitedRewinds: false,
    dailyMatchLimit: -1 // Unlimited
  },
  elite: {
    unlimitedMatches: true,
    priorityVisibility: true,
    profileBoost: true,
    vipSupport: true,
    advancedFilters: true,
    seeWhoLiked: true,
    unlimitedRewinds: true,
    dailyMatchLimit: -1 // Unlimited
  }
};

export async function checkFeatureAccess(userId: string, feature: Feature): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription-features', {
      body: { userId, feature }
    });

    if (error) throw error;
    return data?.hasAccess || false;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

export async function getDailyMatchesRemaining(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription-features', {
      body: { userId, feature: 'daily_matches' }
    });

    if (error) throw error;
    return data?.dailyMatchesRemaining ?? 0;
  } catch (error) {
    console.error('Error checking daily matches:', error);
    return 0;
  }
}

export function getTierFeatures(tier: SubscriptionTier): SubscriptionFeatures['features'] {
  return TIER_FEATURES[tier];
}

export function getTierName(tier: SubscriptionTier): string {
  const names = {
    basic: 'Basic',
    premium: 'Premium',
    elite: 'Elite'
  };
  return names[tier];
}

export function getTierPrice(tier: SubscriptionTier): string {
  const prices = {
    basic: 'Free',
    premium: '$9.99/month',
    elite: '$19.99/month'
  };
  return prices[tier];
}