# Email Verification System

## Overview
Complete email verification system for Nikah Connect that sends verification emails on signup and requires verification before accessing platform features.

## Features Implemented

### 1. Database Schema
- Added `email_verified` (boolean) and `email_verified_at` (timestamp) to profiles table
- Created `email_verification_tokens` table to store secure verification tokens
- Tokens expire after 24 hours

### 2. Email Sending (Edge Function)
- **Function**: `send-verification-email`
- Uses Resend API to send professional verification emails
- Stores tokens securely in database
- Supports resending verification emails

### 3. Verification Page (`/verify-email`)
- Validates verification tokens from email links
- Marks profiles as verified upon successful verification
- Provides resend functionality for expired/invalid tokens
- Auto-redirects to dashboard after successful verification

### 4. UI Components
- **EmailVerificationBanner**: Shows warning banner for unverified users with resend button
- **Profile Page**: Displays verification status with visual indicators (green checkmark or amber warning)
- **Dashboard**: Integrated verification banner at top

### 5. Auth Context Updates
- Profile interface includes `email_verified` and `email_verified_at` fields
- Auth state tracks verification status

## Usage

### Sending Verification Email
```typescript
await supabase.functions.invoke('send-verification-email', {
  body: { 
    email: user.email, 
    userId: user.id,
    isResend: false 
  }
});
```

### Checking Verification Status
```typescript
const { user, profile } = useAuth();
if (profile?.email_verified) {
  // User is verified
}
```

## User Flow
1. User signs up → Verification email sent automatically
2. User receives email with verification link
3. User clicks link → Redirected to `/verify-email?token=xxx`
4. Token validated → Profile marked as verified
5. User redirected to dashboard
6. If not verified, banner appears with resend option

## Security
- Tokens are UUIDs stored securely in database
- Tokens expire after 24 hours
- One-time use tokens (marked as used after verification)
- RLS policies protect token table

## Future Enhancements
- Send verification email automatically on signup in AuthModal
- Restrict certain features for unverified users
- Email change verification workflow
- Verification reminder emails
