# Admin Activity Logging System

## Overview
The admin activity logging system tracks all actions performed by administrators in the dashboard, providing a comprehensive audit trail for security, compliance, and monitoring purposes.

## Database Schema

### admin_activity_logs Table
```sql
- id: UUID (primary key)
- admin_id: UUID (references auth.users)
- action_type: VARCHAR(100)
- details: JSONB
- ip_address: VARCHAR(45)
- created_at: TIMESTAMPTZ
```

### Indexes
- `idx_admin_activity_logs_admin_id` - Fast lookups by admin
- `idx_admin_activity_logs_action_type` - Filter by action type
- `idx_admin_activity_logs_created_at` - Sort by timestamp

## Tracked Actions

### Action Types
1. **access_dashboard** - Admin accesses the dashboard
2. **view_analytics** - Admin views analytics data
3. **trigger_digest** - Admin manually triggers email digest
4. **view_user_data** - Admin views user information
5. **view_cron_logs** - Admin views cron job logs
6. **filter_data** - Admin applies filters
7. **export_data** - Admin exports data
8. **change_settings** - Admin modifies settings

## Implementation

### useAdminLogger Hook
```typescript
const { logAction } = useAdminLogger();

// Log an action
logAction({
  actionType: 'view_analytics',
  details: { startDate, endDate }
});
```

### Automatic Logging
The system automatically logs:
- Dashboard access on page load
- Analytics views with date range
- Manual digest triggers with timestamp
- Cron log views with record count

## ActivityLogViewer Component

### Features
- Display recent admin activity (last 50 logs)
- Filter by action type
- Filter by date range
- Color-coded action badges
- Admin name and email display
- Detailed JSON view of action details
- IP address tracking

### Usage
```tsx
<ActivityLogViewer 
  startDate={startDate} 
  endDate={endDate} 
/>
```

## Security Features

### Row Level Security (RLS)
- Only admins can view activity logs
- Only admins can insert activity logs
- Logs are immutable (no update/delete policies)

### Data Protection
- IP addresses logged for security
- All actions timestamped
- JSON details for flexible data storage
- Admin profile information joined for context

## Best Practices

### What to Log
✓ All data access operations
✓ Configuration changes
✓ Manual interventions
✓ Filter applications
✓ Export operations

### What NOT to Log
✗ Sensitive user data in details field
✗ Passwords or tokens
✗ Excessive detail that impacts performance

### Details Field Guidelines
Store relevant context in the `details` JSONB field:
```typescript
{
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  recordCount: 150,
  filters: { status: 'active' }
}
```

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Frequency of access** - Unusual access patterns
2. **Failed actions** - Potential security issues
3. **Bulk operations** - Data export/modification
4. **Off-hours access** - Access outside business hours

### Alert Triggers
- Multiple failed actions from same admin
- Access from unusual IP addresses
- Bulk data exports
- Configuration changes

## Compliance

### Audit Trail
- Complete history of admin actions
- Immutable log records
- Timestamp precision
- Admin identification

### Data Retention
- Logs stored indefinitely by default
- Consider archiving old logs (>1 year)
- Implement log rotation if needed

## Performance Considerations

### Optimization
- Indexes on frequently queried columns
- Limit query results (default: 50 records)
- Efficient date range filtering
- JSONB for flexible details storage

### Scalability
- Partition table by date for large datasets
- Archive old logs to separate table
- Implement pagination for large result sets

## Future Enhancements

### Potential Features
1. Real-time activity feed
2. Export logs to CSV/JSON
3. Advanced search and filtering
4. Activity heatmaps and visualizations
5. Anomaly detection
6. Email alerts for critical actions
7. Integration with SIEM systems
