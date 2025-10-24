# SMS Notification System Documentation

## Overview
The SMS notification system sends text message alerts for critical events using Twilio API, with phone verification during onboarding and comprehensive rate limiting.

## Features Implemented

### 1. Phone Verification During Onboarding
- **Component**: `src/components/onboarding/PhoneVerification.tsx`
- Step 5 of onboarding flow
- Users enter phone number with country code
- 6-digit verification code sent via SMS
- 10-minute expiration on codes
- Can skip if desired

### 2. Database Schema
```sql
-- Phone fields in profiles table
phone_number TEXT
phone_verified BOOLEAN DEFAULT FALSE
phone_verification_code TEXT
phone_verification_expires_at TIMESTAMPTZ

-- SMS preferences
sms_notifications_enabled BOOLEAN DEFAULT FALSE
notify_matches_sms BOOLEAN DEFAULT TRUE
notify_wali_approvals_sms BOOLEAN DEFAULT TRUE
notify_messages_sms BOOLEAN DEFAULT FALSE
last_sms_sent_at TIMESTAMPTZ

-- Rate limiting table
sms_rate_limits (user_id, phone_number, sms_count, window_start)
```

### 3. Edge Functions

#### send-sms-verification
- Sends 6-digit verification codes
- Rate limiting: 3 SMS per hour per user
- Stores code in database with expiration
- Uses Twilio API

#### send-sms-notification
- Sends notification SMS
- Used for matches, wali approvals, messages
- Checks user preferences before sending

### 4. SMS Notification Helper Functions
**File**: `src/lib/smsNotifications.ts`

```typescript
sendSMSNotification() // Core function with preference checks
notifyMatchSMS() // Send match notification
notifyWaliApprovalSMS() // Send wali approval notification
```

**Rate Limiting**:
- Max 1 SMS per 5 minutes per user (prevents spam)
- Separate from verification rate limits

### 5. Settings Page Integration
Users can control SMS preferences in Settings:
- Enable/disable SMS notifications
- Toggle match notifications via SMS
- Toggle wali approval notifications via SMS
- Toggle message notifications via SMS
- Requires phone verification first

## Usage Examples

### Send Match Notification
```typescript
import { notifyMatchSMS } from '@/lib/smsNotifications';

await notifyMatchSMS(userId, matchName);
```

### Send Wali Approval Notification
```typescript
import { notifyWaliApprovalSMS } from '@/lib/smsNotifications';

await notifyWaliApprovalSMS(waliUserId, wardName);
```

### Verify Phone During Onboarding
```typescript
// Send verification code
await supabase.functions.invoke('send-sms-verification', {
  body: { phoneNumber: '+1234567890', userId: user.id }
});

// Verify code
const { data: profile } = await supabase
  .from('profiles')
  .select('phone_verification_code')
  .eq('id', userId)
  .single();

if (profile.phone_verification_code === enteredCode) {
  await supabase.from('profiles').update({
    phone_verified: true
  }).eq('id', userId);
}
```

## SMS Templates

### Verification Code
```
Your Nikah verification code is: 123456. Valid for 10 minutes.
```

### Match Notification
```
🎉 New match on Nikah! [Name] is interested. Check your matches now.
```

### Wali Approval Notification
```
✅ Wali approval needed: [Ward Name] has a new match request. Review in your Wali Console.
```

## Rate Limiting Details

### Verification SMS
- **Limit**: 3 SMS per hour per phone number
- **Window**: Rolling 60-minute window
- **Table**: `sms_rate_limits`
- **Reset**: Automatic after 1 hour

### Notification SMS
- **Limit**: 1 SMS per 5 minutes per user
- **Tracked**: `last_sms_sent_at` in profiles table
- **Purpose**: Prevent notification spam

## Security Features

1. **Phone Verification Required**: Users must verify phone before receiving SMS
2. **Rate Limiting**: Multiple layers prevent abuse
3. **Preference Controls**: Users control what notifications they receive
4. **Expiring Codes**: Verification codes expire after 10 minutes
5. **Twilio Integration**: Secure API calls via edge functions

## Integration Points

### Onboarding Flow
- Step 5: Phone verification (optional)
- Users can skip and verify later

### Settings Page
- SMS Notifications card
- Toggle individual notification types
- Shows verification status

### Match System
- Automatically sends SMS when mutual match occurs
- Respects user preferences

### Wali System
- Notifies wali when approval needed
- Critical for guardian involvement

## Environment Variables Required

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

## Best Practices

1. **Always Check Verification**: Only send to verified numbers
2. **Respect Preferences**: Check user settings before sending
3. **Rate Limit**: Prevent spam with appropriate limits
4. **Clear Messages**: Keep SMS concise and actionable
5. **Fallback**: Email notifications as backup

## Future Enhancements

- [ ] SMS delivery status tracking
- [ ] International phone number validation
- [ ] Custom SMS templates per user
- [ ] SMS notification history
- [ ] Bulk SMS for announcements
