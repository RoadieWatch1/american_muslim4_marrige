# Email Digest Cron Job Setup

## Overview
The email digest system runs daily at 9:00 AM UTC to process and send digest emails to users who have selected daily or weekly notification preferences.

## Setup Options

### Option 1: Supabase pg_cron (Recommended)
The cron job has been configured using Supabase's pg_cron extension.

**Status**: ✅ Active
- **Schedule**: Daily at 9:00 AM UTC (`0 9 * * *`)
- **Function**: `process-email-digests`
- **Job Name**: `process-email-digests-daily`

**View Cron Jobs**:
```sql
SELECT * FROM cron.job;
```

**View Job Execution History**:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'process-email-digests-daily' 
ORDER BY start_time DESC 
LIMIT 10;
```

**Disable Cron Job**:
```sql
SELECT cron.unschedule('process-email-digests-daily');
```

**Re-enable Cron Job**:
```sql
SELECT cron.schedule(
  'process-email-digests-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://iqmfgvypxqtpqaxdajqt.supabase.co/functions/v1/process-email-digests',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Option 2: GitHub Actions
A GitHub Actions workflow is also available as a backup or alternative.

**Setup**:
1. Go to your GitHub repository settings
2. Navigate to Secrets and Variables → Actions
3. Add the following secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

**File**: `.github/workflows/email-digest-cron.yml`
- **Schedule**: Daily at 9:00 AM UTC
- **Manual Trigger**: Available via "Actions" tab

**Test Manually**:
1. Go to GitHub Actions tab
2. Select "Email Digest Cron Job"
3. Click "Run workflow"

## Monitoring

### Cron Job Logs Table
All cron job executions are logged to the `cron_job_logs` table:

```sql
-- View recent cron job logs
SELECT 
  executed_at,
  status,
  notifications_processed,
  emails_sent,
  error_message
FROM cron_job_logs
ORDER BY executed_at DESC
LIMIT 20;

-- View failed executions
SELECT * FROM cron_job_logs
WHERE status = 'failed'
ORDER BY executed_at DESC;

-- View statistics
SELECT 
  DATE(executed_at) as date,
  COUNT(*) as executions,
  SUM(emails_sent) as total_emails,
  SUM(notifications_processed) as total_notifications,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failures
FROM cron_job_logs
GROUP BY DATE(executed_at)
ORDER BY date DESC;
```

### Edge Function Logs
View logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `process-email-digests`
3. Click "Logs" tab

### Alert Setup

**Option 1: Database Trigger Alert**
Create a trigger to alert on failures:
```sql
-- TODO: Set up notification trigger for failed jobs
-- This could send to Slack, email, or other monitoring service
```

**Option 2: GitHub Actions Notifications**
The GitHub Actions workflow will:
- Show as failed in the Actions tab
- Can be configured to send notifications (Slack, email, etc.)

**Option 3: Monitoring Service**
Integrate with services like:
- Sentry
- DataDog
- Better Uptime
- Cronitor

## Testing

### Manual Test via Supabase
```bash
curl -X POST \
  'https://iqmfgvypxqtpqaxdajqt.supabase.co/functions/v1/process-email-digests' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Test with Mock Data
```sql
-- Create test pending notifications
INSERT INTO pending_notifications (user_id, notification_type, subject, body)
SELECT 
  id,
  'new_message',
  'Test notification',
  'This is a test'
FROM profiles
WHERE notification_frequency = 'daily'
LIMIT 1;
```

## Troubleshooting

### Cron Job Not Running
1. Check if pg_cron is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verify job is scheduled:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-email-digests-daily';
   ```

3. Check execution history:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobname = 'process-email-digests-daily' 
   ORDER BY start_time DESC;
   ```

### Emails Not Sending
1. Check RESEND_API_KEY is configured
2. Verify user has pending notifications
3. Check user's notification preferences
4. Review cron_job_logs for errors

### Performance Issues
- Monitor execution duration in logs
- Consider batching for large user bases
- Add pagination if processing times exceed limits

## Maintenance

### Cleanup Old Logs
```sql
-- Delete logs older than 90 days
DELETE FROM cron_job_logs
WHERE executed_at < NOW() - INTERVAL '90 days';
```

### Cleanup Sent Notifications
```sql
-- Archive or delete sent notifications older than 30 days
DELETE FROM pending_notifications
WHERE is_sent = true 
AND sent_at < NOW() - INTERVAL '30 days';
```

## Future Enhancements
- Real-time alerting on failures
- Dashboard for monitoring digest statistics
- A/B testing for digest formats
- Personalized send time optimization
- Retry logic for failed sends
