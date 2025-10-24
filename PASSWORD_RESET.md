# Password Reset System

## Overview
The password reset system allows users to securely reset their passwords through a token-based email verification process with built-in rate limiting to prevent abuse.

## Database Schema

### password_reset_tokens
Stores secure reset tokens with expiration:
- `id`: UUID primary key
- `user_id`: References auth.users
- `token`: Unique reset token
- `expires_at`: Token expiration timestamp (1 hour)
- `used`: Boolean flag to prevent token reuse
- `created_at`: Timestamp

### password_reset_rate_limit
Tracks reset requests to prevent abuse:
- `id`: UUID primary key
- `email`: User's email address
- `ip_address`: Optional IP tracking
- `request_count`: Number of requests
- `window_start`: Start of rate limit window
- `created_at`: Timestamp

**Rate Limit**: 3 requests per hour per email address

## Edge Function: send-password-reset

### Endpoint
`POST /functions/v1/send-password-reset`

### Request Body
```json
{
  "email": "user@example.com"
}
```

### Response
```json
{
  "success": true
}
```

### Features
- Rate limiting (3 requests/hour)
- Secure token generation using crypto.randomUUID()
- 1-hour token expiration
- Email enumeration prevention (always returns success)
- Professional email template with reset link

### Environment Variables Required
- `RESEND_API_KEY`: For sending emails
- `SUPABASE_URL`: Database connection
- `SUPABASE_SERVICE_ROLE_KEY`: Admin access
- `SITE_URL`: Frontend URL for reset link

## User Flow

### 1. Request Password Reset
- User clicks "Forgot Password?" in AuthModal
- ForgotPasswordModal opens
- User enters email and submits
- System checks rate limits
- If valid, generates token and sends email
- Success message displayed (even if email doesn't exist)

### 2. Receive Reset Email
- Professional email sent via Resend
- Contains reset link: `/reset-password?token={token}`
- Link expires in 1 hour
- Clear instructions provided

### 3. Reset Password
- User clicks link in email
- ResetPassword page validates token
- Checks: token exists, not used, not expired
- User enters new password (min 8 characters)
- User confirms password
- Password updated via Supabase Admin API
- Token marked as used
- Success message and redirect to home

## Components

### ForgotPasswordModal
Location: `src/components/auth/ForgotPasswordModal.tsx`

Features:
- Email input with validation
- Loading states
- Error handling (including rate limit errors)
- Success confirmation
- Auto-closes after 5 seconds

### ResetPassword Page
Location: `src/pages/ResetPassword.tsx`

Features:
- Token validation on mount
- Password strength requirement (8+ characters)
- Password confirmation matching
- Real-time error feedback
- Success state with auto-redirect
- Invalid/expired token handling

### AuthModal Integration
Location: `src/components/auth/AuthModal.tsx`

Added:
- "Forgot Password?" link in signin form
- Opens ForgotPasswordModal when clicked
- Maintains existing OTP authentication flow

## Security Features

1. **Rate Limiting**
   - 3 requests per hour per email
   - Prevents brute force attacks
   - Tracked in database

2. **Token Security**
   - Cryptographically secure random tokens
   - 1-hour expiration
   - Single-use tokens (marked as used)
   - Stored in database with RLS policies

3. **Email Enumeration Prevention**
   - Always returns success response
   - Doesn't reveal if email exists
   - Prevents account discovery

4. **Password Requirements**
   - Minimum 8 characters
   - Confirmation matching
   - Client and server-side validation

5. **RLS Policies**
   - No direct client access to tokens
   - No direct client access to rate limit data
   - All operations via edge function

## Routes

- `/reset-password?token={token}` - Password reset page
- Existing routes maintained

## Email Template

Professional HTML email includes:
- Nikah Connect branding
- Clear call-to-action button
- Expiration notice (1 hour)
- Security reminder
- Teal color scheme matching platform

## Error Handling

### Rate Limit Exceeded
- HTTP 429 status
- User-friendly message
- Suggests trying again later

### Invalid Token
- Clear error message
- "Return to Home" button
- Prevents password reset attempt

### Expired Token
- Detected on page load
- Clear messaging
- Option to request new reset

### Password Validation
- Real-time feedback
- Length requirements
- Matching confirmation

## Testing

### Test Password Reset Flow
1. Click "Forgot Password?" in auth modal
2. Enter email address
3. Check email for reset link
4. Click link to open reset page
5. Enter and confirm new password
6. Verify redirect and success message

### Test Rate Limiting
1. Request password reset 3 times quickly
2. 4th request should show rate limit error
3. Wait 1 hour or clear rate limit table
4. Should work again

### Test Token Expiration
1. Request password reset
2. Wait 1 hour (or manually expire token in DB)
3. Try to use link
4. Should show expired error

### Test Token Reuse Prevention
1. Complete password reset successfully
2. Try to use same link again
3. Should show invalid token error

## Maintenance

### Clear Old Tokens
Periodically clean up expired tokens:
```sql
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW() OR used = true;
```

### Clear Rate Limit Data
Reset rate limits older than 1 hour:
```sql
DELETE FROM password_reset_rate_limit 
WHERE window_start < NOW() - INTERVAL '1 hour';
```

### Monitor Usage
Check reset request patterns:
```sql
SELECT email, COUNT(*) as request_count, MAX(created_at) as last_request
FROM password_reset_rate_limit
GROUP BY email
ORDER BY request_count DESC;
```

## Future Enhancements

1. **IP-based Rate Limiting**
   - Track by IP address
   - Prevent distributed attacks

2. **SMS Verification**
   - Alternative to email
   - Use Twilio integration

3. **Password History**
   - Prevent reusing recent passwords
   - Store hashed password history

4. **Account Lockout**
   - Lock account after multiple failed attempts
   - Require admin unlock

5. **Two-Factor Authentication**
   - Require 2FA for password reset
   - Enhanced security for sensitive accounts
