# Admin User Management System

## Overview
Comprehensive admin panel for managing users, viewing activity logs, and handling reported profiles.

## Features

### 1. User Management
- **View All Users**: Display complete user list with pagination
- **Search & Filter**: 
  - Search by name or email
  - Filter by role (User/Wali)
  - Filter by status (Active/Disabled)
- **Account Actions**:
  - Disable/Enable user accounts
  - Reset 2FA for locked-out users
  - View user details

### 2. Reported Profiles
- View all reported profiles
- Filter by status (Pending/Reviewed/Resolved/Dismissed)
- Review report details
- Add admin notes
- Resolve or dismiss reports
- Track reporter and reported user information

### 3. Activity Logs
- View all admin actions
- Filter by date range
- Track who performed what action
- Audit trail for compliance

### 4. Email System Monitoring
- View cron job execution logs
- Monitor email digest analytics
- Track notification delivery

## Database Schema

### profiles table additions:
```sql
is_admin BOOLEAN DEFAULT FALSE
is_active BOOLEAN DEFAULT TRUE
```

### reported_profiles table:
```sql
id UUID PRIMARY KEY
reporter_id UUID (references profiles)
reported_user_id UUID (references profiles)
reason TEXT
description TEXT
status TEXT (pending/reviewed/resolved/dismissed)
admin_notes TEXT
reviewed_by UUID (references profiles)
reviewed_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## Edge Functions

### admin-user-actions
Handles admin operations:
- `disable`: Disable user account
- `enable`: Enable user account
- `reset_2fa`: Reset 2FA for user

**Request:**
```json
{
  "action": "disable|enable|reset_2fa",
  "userId": "user-uuid",
  "adminId": "admin-uuid"
}
```

## Access Control
- Only users with `is_admin = true` can access admin panel
- AdminRoute component protects admin pages
- Edge functions verify admin status before executing actions
- All admin actions are logged to admin_activity_logs

## Usage

### Making a User Admin
```sql
UPDATE profiles SET is_admin = true WHERE email = 'admin@example.com';
```

### Accessing Admin Panel
Navigate to `/admin` - only accessible to admin users

## Components
- `UserManagement`: User list with search/filter/actions
- `ReportedProfiles`: Manage reported profiles
- `ActivityLogViewer`: View admin activity logs
- `AdminRoute`: Protect admin-only routes
- `AdminDashboard`: Main admin interface with tabs

## Security
- Row Level Security (RLS) on all tables
- Admin verification in edge functions
- Activity logging for audit trail
- Service role key used for admin operations
