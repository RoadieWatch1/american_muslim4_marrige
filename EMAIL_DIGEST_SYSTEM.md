# Email Digest System Documentation

## Overview
The email digest system allows users to receive consolidated email notifications instead of instant alerts. Users can choose between instant, daily, or weekly digest frequencies.

## Architecture

### Database Schema
**pending_notifications table:**
- `id`: UUID primary key
- `user_id`: Reference to auth.users
- `notification_type`: Type of notification (wali_invitation, intro_request, match, new_message)
- `subject`: Email subject line
- `content`: Email HTML content
- `metadata`: JSONB with additional data
- `is_sent`: Boolean flag
- `sent_at`: Timestamp when sent
- `created_at`: Creation timestamp

### Edge Functions

#### 1. send-notification-email
**Updated behavior:**
- Checks user's notification preferences
- For instant notifications: Sends email immediately via Resend API
- For daily/weekly digests: Stores notification in pending_notifications table
- Returns appropriate response indicating if email was sent or queued

#### 2. process-email-digests (NEW)
**Purpose:** Scheduled cron job to process digest emails
**Schedule:** Should run daily at a specific time (e.g., 9 AM UTC)
**Process:**
1. Checks current day (Monday for weekly digests)
2. Queries users with daily or weekly digest preferences
3. Fetches pending unsent notifications for each user
4. Groups notifications by type
5. Generates digest email with summary and details
6. Sends consolidated email via Resend API
7. Marks notifications as sent in database

**Digest Email Format:**
- Summary section with counts by notification type
- Detailed sections for each notification type (up to 5 shown)
- Links to view all notifications in the app
- Link to update notification preferences

## Cron Job Setup

✅ **ACTIVE**: The cron job has been configured and is running!

### Current Configuration
- **Method**: Supabase pg_cron extension
- **Schedule**: Daily at 9:00 AM UTC (`0 9 * * *`)
- **Status**: Active and monitoring
- **Monitoring**: Logs stored in `cron_job_logs` table

### Monitoring & Management
See [CRON_SETUP.md](./CRON_SETUP.md) for complete documentation including:
- Viewing cron job status and history
- Monitoring execution logs
- Troubleshooting failed runs
- Testing procedures
- Alert setup
- Maintenance tasks

### Quick Status Check
```sql
-- View recent executions
SELECT * FROM cron_job_logs 
ORDER BY executed_at DESC 
LIMIT 10;

-- Check cron job status
SELECT * FROM cron.job 
WHERE jobname = 'process-email-digests-daily';
```

### Backup Method: GitHub Actions
A GitHub Actions workflow is also available at `.github/workflows/email-digest-cron.yml` as a backup or alternative scheduling method.


## User Preferences

Users can configure their notification preferences in Settings:
- **Email Notifications Enabled:** Master toggle
- **Notification Types:** Individual toggles for each type
- **Frequency:** 
  - Instant: Emails sent immediately
  - Daily: Digest sent once per day
  - Weekly: Digest sent once per week (Mondays)

## Notification Flow

### Instant Notifications
1. Event occurs (match, message, etc.)
2. App calls send-notification-email edge function
3. Function checks preferences
4. Email sent immediately via Resend
5. User receives notification instantly

### Digest Notifications
1. Event occurs
2. App calls send-notification-email edge function
3. Function checks preferences and sees digest frequency
4. Notification stored in pending_notifications table
5. Cron job runs daily
6. For daily users: Aggregates and sends digest
7. For weekly users: Only sends on Mondays
8. Notifications marked as sent

## Testing

### Manual Testing
Trigger the digest processor manually:
```bash
curl -X POST https://iqmfgvypxqtpqaxdajqt.supabase.co/functions/v1/process-email-digests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Test Scenarios
1. Create test user with daily digest preference
2. Generate multiple notifications
3. Run digest processor
4. Verify email received with all notifications
5. Confirm notifications marked as sent in database

## Monitoring

Monitor the system by:
1. Checking edge function logs in Supabase dashboard
2. Querying pending_notifications table for unsent items
3. Tracking email delivery via Resend dashboard
4. Setting up alerts for failed digest sends

## Future Enhancements

1. **Customizable digest times:** Let users choose when they receive digests
2. **Smart batching:** Group similar notifications intelligently
3. **Notification priorities:** Mark urgent notifications to send instantly
4. **Read receipts:** Track which notifications users have viewed
5. **Unsubscribe links:** Allow users to opt out of specific types
6. **Rich email templates:** More visually appealing digest formats
7. **Mobile push notifications:** Complement email with push alerts
8. **Notification history:** In-app view of all past notifications
