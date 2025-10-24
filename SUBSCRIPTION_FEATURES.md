# Subscription Features & Tier Gating

## Overview
The Islamic matchmaking platform implements a three-tier subscription model with feature gating to provide value at different price points.

## Subscription Tiers

### Basic (Free)
- **Daily Matches**: Limited to 3 matches per day
- **Visibility**: Standard visibility in discovery
- **Support**: Standard email support
- **Filters**: Basic age, location, denomination filters

### Premium ($9.99/month)
- **Daily Matches**: Unlimited
- **Visibility**: Priority visibility in discovery queue
- **Support**: Priority support response
- **Filters**: Advanced filters (verified only, has photo, recently active)
- **Features**: 
  - See who liked you
  - Advanced search filters
  - Read receipts in messages

### Elite ($19.99/month)
- **Daily Matches**: Unlimited
- **Visibility**: Priority visibility + Profile Boost feature
- **Support**: VIP 24/7 support
- **Filters**: All advanced filters
- **Features**: 
  - Everything in Premium
  - Profile boost (24-hour visibility boost)
  - Unlimited rewinds
  - VIP badge on profile
  - Dedicated account manager

## Implementation Details

### Database Schema
```sql
-- profiles table additions
subscription_tier VARCHAR DEFAULT 'basic'
subscription_status VARCHAR DEFAULT 'active'
subscription_expires_at TIMESTAMPTZ
profile_boosted_until TIMESTAMPTZ
last_boost_date DATE

-- daily_matches table
CREATE TABLE daily_matches (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  matched_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Feature Gating Logic

#### Daily Match Limits (Basic Tier)
- Tracks matches in `daily_matches` table
- Resets at midnight UTC
- Shows remaining matches in UI
- Blocks swipe actions when limit reached

#### Priority Visibility (Premium/Elite)
- Orders profiles by subscription tier in discovery
- Elite users with active boosts appear first
- Premium users appear before Basic users

#### Profile Boost (Elite Only)
- 24-hour visibility boost
- Can be activated once per day
- Appears at top of discovery queue
- Visual indicator on profile card

### Edge Function: check-subscription-features
Validates user access to specific features based on their subscription tier.

**Endpoint**: `/functions/v1/check-subscription-features`

**Request**:
```json
{
  "userId": "user-uuid",
  "feature": "unlimited_matches"
}
```

**Response**:
```json
{
  "hasAccess": true,
  "tier": "premium",
  "isActive": true,
  "dailyMatchesRemaining": null
}
```

## UI Components

### Discover Page
- Shows daily match counter for Basic users
- Displays upgrade prompt when limit reached
- Premium/Elite badge with benefits
- Disabled swipe buttons when limit reached

### Dashboard
- Subscription status card
- Daily matches remaining (Basic)
- Visibility status indicator
- Profile boost button (Elite)

### Settings
- Billing management section
- Current plan display
- Upgrade/downgrade options
- Cancel subscription

### Filter Panel
- Advanced filters locked for Basic users
- Upgrade prompt for locked features
- Visual indicators for premium features

## Usage Examples

### Check Feature Access
```typescript
import { checkFeatureAccess } from '@/lib/subscriptionFeatures';

const canUseAdvancedFilters = await checkFeatureAccess(userId, 'advanced_filters');
if (!canUseAdvancedFilters) {
  // Show upgrade prompt
}
```

### Get Daily Matches Remaining
```typescript
import { getDailyMatchesRemaining } from '@/lib/subscriptionFeatures';

const remaining = await getDailyMatchesRemaining(userId);
if (remaining === 0) {
  // Show "Daily limit reached" message
}
```

### Boost Profile (Elite)
```typescript
const boostProfile = async () => {
  const boostUntil = new Date();
  boostUntil.setHours(boostUntil.getHours() + 24);
  
  await supabase
    .from('profiles')
    .update({ 
      profile_boosted_until: boostUntil.toISOString(),
      last_boost_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', userId);
};
```

## Stripe Integration
- Uses Stripe Checkout for subscription signup
- Webhook handles subscription updates
- Automatic tier updates on payment success
- Grace period for failed payments

## Best Practices
1. Always check feature access before displaying premium features
2. Provide clear upgrade paths when features are locked
3. Show value proposition for each tier
4. Handle subscription status changes gracefully
5. Cache subscription status to reduce API calls