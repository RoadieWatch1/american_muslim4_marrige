# Admin Dashboard Documentation

## Overview
The Admin Dashboard provides comprehensive monitoring and analytics for the email digest notification system.

## Accessing the Dashboard
Navigate to `/admin` in your application to access the admin dashboard.

## Features

### 1. Key Metrics Overview
Four key statistics displayed at the top:
- **Total Users**: Total number of registered users
- **Daily Digest**: Users subscribed to daily email digests
- **Weekly Digest**: Users subscribed to weekly email digests  
- **Pending**: Number of notifications waiting to be sent in next digest

### 2. Date Range Filter
Filter all analytics and cron job logs by date range:
- Select start and end dates
- Click "Apply" to refresh data
- Default shows last 7 days

### 3. Email Volume Trends Chart
Bar chart showing email volumes over time:
- Daily digest emails sent
- Weekly digest emails sent
- Instant notification emails sent
- Helps identify trends and peak usage periods

### 4. Notification Types Breakdown
Pie chart showing distribution of notification types:
- Likes received
- New matches
- Messages
- Introduction requests
- Wali actions
- Helps understand what notifications users receive most

### 5. Delivery Success Rate
Large percentage display showing:
- Overall email delivery success rate
- Calculated from cron job execution logs
- Target: 95%+ success rate

### 6. Recent Cron Job Executions
Detailed log of recent digest processing runs:
- Job name and status (success/error)
- Execution timestamp
- Duration in milliseconds
- Number of emails sent
- Number of notifications processed
- Error messages for failed jobs
- Shows last 20 executions within date range

### 7. Manual Digest Trigger
"Trigger Digest" button allows manual execution:
- Useful for testing
- Processes all pending notifications immediately
- Shows success/error toast notification
- Displays number of emails sent
- Refreshes dashboard data after completion

## Monitoring Failed Jobs

Failed cron jobs are highlighted in red with:
- Alert icon
- "error" badge
- Full error message displayed
- Helps quickly identify and troubleshoot issues

## Best Practices

### Regular Monitoring
- Check dashboard daily for failed jobs
- Monitor success rate trends
- Review pending notification counts

### Investigating Issues
1. Check failed job error messages
2. Verify cron job is running (see CRON_SETUP.md)
3. Check Resend API key is valid
4. Review user email addresses for bounces
5. Check Supabase logs for detailed errors

### Testing Changes
1. Use manual trigger button to test digest processing
2. Monitor execution time and success rate
3. Verify email content and formatting
4. Check notification counts decrease after processing

## Database Queries

The dashboard queries these tables:
- `cron_job_logs`: Execution history and metrics
- `pending_notifications`: Queued notifications
- `profiles`: User notification preferences

## Security Considerations

- Restrict admin dashboard access to admin users only
- Implement authentication checks before displaying data
- Consider adding role-based access control (RBAC)
- Log admin actions for audit trail

## Future Enhancements

Potential improvements:
- Real-time updates using Supabase subscriptions
- Export analytics data to CSV
- Email delivery bounce tracking
- User engagement metrics (open rates, click rates)
- Notification preference change trends
- Automated alerting for failed jobs
- Performance optimization recommendations
