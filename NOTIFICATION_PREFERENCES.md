# Email Notification Preferences System

## Overview
Users can now manage their email notification preferences through a dedicated Settings page. The system checks user preferences before sending any email notifications.

## Features

### Settings Page (`/settings`)
- **Master Toggle**: Enable/disable all email notifications
- **Notification Types**: Individual toggles for:
  - Wali invitations
  - Introduction requests
  - Matches
  - New messages
- **Notification Frequency**: Choose when to receive emails:
  - Instant (default) - Send immediately
  - Daily Digest - Once per day (not yet implemented)
  - Weekly Digest - Once per week (not yet implemented)

### Database Schema
Added columns to `profiles` table:
- `email_notifications_enabled` (boolean, default: true)
- `notify_wali_invitations` (boolean, default: true)
- `notify_intro_requests` (boolean, default: true)
- `notify_matches` (boolean, default: true)
- `notify_messages` (boolean, default: true)
- `notification_frequency` (text, default: 'instant')

### Edge Function Integration
The `send-notification-email` edge function now:
1. Accepts an optional `recipientUserId` parameter
2. Queries the user's notification preferences from the database
3. Checks if email notifications are enabled globally
4. Checks if the specific notification type is enabled
5. Verifies notification frequency (currently only 'instant' is supported)
6. Skips sending email if any preference check fails
7. Returns success with skip reason if email was not sent

## Usage

### Accessing Settings
Users can access notification settings from:
- Dashboard → Settings card
- Direct navigation to `/settings`

### Email Function Calls
When sending emails, include the recipient's user ID:

```typescript
await supabase.functions.invoke('send-notification-email', {
  body: {
    type: 'match',
    to: 'user@example.com',
    recipientUserId: 'user-uuid-here', // Include for preference checking
    data: {
      matchName: 'John Doe',
      loginUrl: 'https://app.com/messages'
    }
  }
});
```

### Response Handling
The edge function returns:
- `{ success: true, data: {...} }` - Email sent successfully
- `{ success: true, skipped: true, reason: '...' }` - Email skipped due to preferences
- `{ success: false, error: '...' }` - Error occurred

## Future Enhancements

### Daily/Weekly Digests
To implement digest functionality:
1. Store notifications in a `pending_notifications` table
2. Create a scheduled edge function (cron job)
3. Query pending notifications based on user frequency preference
4. Send digest emails with all pending notifications
5. Mark notifications as sent

### Additional Features
- Email preview before saving preferences
- Notification history/log
- Quiet hours (don't send emails during certain times)
- Per-contact notification preferences
- Push notification preferences (for mobile app)
