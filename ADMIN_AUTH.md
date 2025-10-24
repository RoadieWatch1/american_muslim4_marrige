# Admin Authentication & Authorization

## Overview
The admin dashboard is protected by role-based access control (RBAC) to ensure only authorized users can access sensitive analytics and monitoring features.

## Implementation

### Database Schema
Added `is_admin` column to the `profiles` table:
```sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

### AuthContext Enhancement
- Added `isAdmin` boolean to AuthContext
- Automatically computed from `profile.is_admin` value
- Available throughout the app via `useAuth()` hook

### Route Protection
Created `AdminRoute` component that:
- Checks if user is authenticated
- Verifies user has admin role (`isAdmin === true`)
- Redirects non-admin users to dashboard with error toast
- Shows loading state during authentication check

### Navigation Integration
- Admin dashboard card only visible to admin users in Dashboard
- Styled with purple gradient to distinguish from regular features
- Direct navigation to `/admin` route

## Granting Admin Access

To grant admin access to a user, update their profile in Supabase:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

Or via Supabase Dashboard:
1. Go to Table Editor → profiles
2. Find the user's row
3. Set `is_admin` to `true`

## Security Features

1. **Server-side validation**: Always verify admin status in edge functions
2. **Client-side protection**: AdminRoute prevents unauthorized access
3. **User feedback**: Clear error messages for denied access
4. **Loading states**: Prevents flash of unauthorized content

## Usage in Components

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAdmin } = useAuth();
  
  return (
    <>
      {isAdmin && (
        <AdminOnlyFeature />
      )}
    </>
  );
}
```

## Future Enhancements

- Multiple admin roles (super admin, moderator, support)
- Admin activity logging
- Permission-based access control
- Admin invitation system
