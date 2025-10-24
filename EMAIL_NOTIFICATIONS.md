# Email Notification System

A comprehensive email notification system for the Islamic matchmaking platform with support for instant notifications and daily/weekly digests.

## Features

### Notification Types
- **New Matches**: When users have a mutual match
- **New Messages**: When users receive messages
- **Wali Approvals**: When wali approves a connection
- **Wali Invitations**: When someone invites you as their wali
- **Introduction Requests**: When someone requests an introduction

### Notification Preferences
Users can control their email notifications in Settings:
- Enable/disable email notifications entirely
- Choose which notification types to receive
- Select notification frequency:
  - **Instant**: Emails sent immediately
  - **Daily Digest**: One email per day with all notifications
  - **Weekly Digest**: One email per week with all notifications

## Database Schema

### Profiles Table Columns
```sql
email_notifications_enabled BOOLEAN DEFAULT true
notify_wali_invitations BOOLEAN DEFAULT true
notify_intro_requests BOOLEAN DEFAULT true
notify_matches BOOLEAN DEFAULT true
notify_messages BOOLEAN DEFAULT true
notification_frequency TEXT DEFAULT 'instant'
last_digest_sent_at TIMESTAMPTZ
```

### Notification Queue Table
```sql
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users(id)
  notification_type TEXT
  title TEXT
  message TEXT
  metadata JSONB
  sent BOOLEAN DEFAULT false
  created_at TIMESTAMPTZ
)
```

## Edge Functions

### send-notification-email
Sends individual notification emails with beautiful HTML templates.

**Endpoint**: `/functions/v1/send-notification-email`

**Request**:
```json
{
  "to": "user@example.com",
  "type": "match",
  "data": {
    "matchName": "Ahmed",
    "appUrl": "https://your-app.com"
  }
}
```

### send-digest-emails
Processes notification queue and sends digest emails.

**Endpoint**: `/functions/v1/send-digest-emails`

**Request**:
```json
{
  "frequency": "daily"
}
```

## Usage in Code

### Send Instant Notification
```typescript
import { notifyNewMatch } from '@/lib/notifications';

// When users match
await notifyNewMatch(userId, matchName);
```

### Send Message Notification
```typescript
import { notifyNewMessage } from '@/lib/notifications';

// When message is sent
await notifyNewMessage(recipientId, senderName, messagePreview);
```

### Send Wali Approval
```typescript
import { notifyWaliApproval } from '@/lib/notifications';

// When wali approves
await notifyWaliApproval(userId, waliName, matchName);
```

## Cron Jobs

Daily and weekly digests are sent via GitHub Actions:
- **Daily**: Every day at 8 AM UTC
- **Weekly**: Every Monday at 8 AM UTC

Configure in `.github/workflows/email-digest-cron.yml`

## Setup Instructions

### 1. Configure Resend API
Add your Resend API key to Supabase secrets:
```bash
supabase secrets set RESEND_API_KEY=re_...
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy send-notification-email
supabase functions deploy send-digest-emails
```

### 3. Run Database Migration
```bash
supabase db push
```

### 4. Configure GitHub Secrets
Add to your repository secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Test Notifications
```typescript
// In your code
import { notifyNewMatch } from '@/lib/notifications';
await notifyNewMatch('user-id', 'Match Name');
```

## Email Templates

All emails include:
- Islamic greeting (Assalamu Alaikum)
- Clear subject line with emoji
- Professional HTML styling
- Call-to-action button
- Brand colors (emerald green)

## Best Practices

1. **Always check preferences**: The notification system automatically checks user preferences
2. **Provide context**: Include relevant names and details in notifications
3. **Test thoroughly**: Test both instant and digest modes
4. **Monitor queue**: Check notification_queue table for pending notifications
5. **Handle errors**: All functions include error handling and logging

## Troubleshooting

### Emails not sending
- Check Resend API key is configured
- Verify edge functions are deployed
- Check user has email_notifications_enabled = true
- Check specific notification type is enabled

### Digests not working
- Verify cron job is running (GitHub Actions)
- Check notification_queue has pending notifications
- Verify users have correct notification_frequency setting

### Testing locally
```bash
# Test instant notification
supabase functions serve send-notification-email

# Test digest
supabase functions serve send-digest-emails
```
