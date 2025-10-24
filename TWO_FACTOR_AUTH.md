# Two-Factor Authentication (2FA) System

## Overview
The Islamic matchmaking platform now includes SMS-based two-factor authentication for enhanced security. Users can enable 2FA in their settings to require phone verification during login.

## Features

### 1. 2FA Setup
- Located in Settings page (`/settings`)
- Users can add phone number and enable 2FA
- SMS verification required to activate
- Option to disable 2FA at any time

### 2. Login Flow with 2FA
1. User enters email and receives OTP
2. User verifies email OTP
3. System checks if 2FA is enabled
4. If enabled, SMS code sent to registered phone
5. User verifies SMS code
6. Access granted after successful verification

### 3. Rate Limiting
- Maximum 3 SMS codes per 15 minutes per user
- Prevents abuse and reduces costs
- Automatic cleanup of expired codes

## Database Schema

### Profiles Table (Updated)
```sql
ALTER TABLE profiles 
ADD COLUMN phone_number TEXT,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN two_factor_verified BOOLEAN DEFAULT false;
```

### Two-Factor Codes Table
```sql
CREATE TABLE two_factor_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  verified BOOLEAN DEFAULT false,
  attempts INT DEFAULT 0
);
```

## Edge Functions

### send-2fa-code
Sends SMS verification codes via Twilio.

**Endpoint:** `/functions/v1/send-2fa-code`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "userId": "uuid",
  "action": "login" | "setup"
}
```

**Features:**
- Rate limiting (3 requests per 15 minutes)
- 6-digit code generation
- 10-minute expiration
- Twilio SMS integration

## Components

### TwoFactorSetup
- Location: `src/components/settings/TwoFactorSetup.tsx`
- Allows users to enable/disable 2FA
- Phone number verification
- Status display

### TwoFactorModal
- Location: `src/components/auth/TwoFactorModal.tsx`
- Appears during login when 2FA is enabled
- SMS code verification
- Error handling

### AuthModal (Updated)
- Location: `src/components/auth/AuthModal.tsx`
- Integrated 2FA check after email verification
- Triggers TwoFactorModal when needed
- Seamless authentication flow

## Security Features

1. **Rate Limiting**: Prevents brute force attacks
2. **Code Expiration**: Codes expire after 10 minutes
3. **Phone Verification**: Required before enabling 2FA
4. **Secure Storage**: Codes stored with user association
5. **Attempt Tracking**: Monitor verification attempts

## User Experience

### Enabling 2FA
1. Navigate to Settings
2. Scroll to "Two-Factor Authentication" card
3. Enter phone number with country code
4. Click "Send Verification Code"
5. Enter received 6-digit code
6. 2FA is now enabled

### Login with 2FA
1. Enter email and receive OTP
2. Verify email OTP
3. Automatically prompted for SMS code
4. Enter 6-digit SMS code
5. Successfully logged in

### Disabling 2FA
1. Navigate to Settings
2. Click "Disable 2FA" button
3. 2FA is disabled (phone number retained)

## Environment Variables

Required in Supabase Edge Functions:
- `TWILIO_ACCOUNT_SID`: Twilio account identifier
- `TWILIO_AUTH_TOKEN`: Twilio authentication token
- `TWILIO_PHONE_NUMBER`: Sending phone number (optional, defaults to test number)

## Testing

### Test Phone Numbers (Twilio)
For development, use Twilio test credentials:
- Phone: +15005550006
- Any 6-digit code will work in test mode

### Production
- Configure real Twilio credentials
- Use verified phone numbers
- Monitor SMS delivery rates

## Best Practices

1. **Phone Format**: Always include country code (e.g., +1 for US)
2. **User Communication**: Inform users about SMS charges
3. **Backup Access**: Provide alternative recovery methods
4. **Code Security**: Never log or display codes in production
5. **Rate Limits**: Adjust based on user needs and abuse patterns

## Future Enhancements

- Backup codes for account recovery
- TOTP/Authenticator app support
- Trusted device management
- SMS delivery status tracking
- Multi-region phone number support
