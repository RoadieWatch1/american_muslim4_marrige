# Backup Recovery Codes for 2FA

## Overview
This system provides backup recovery codes as a fallback authentication method when users lose access to their phone for 2FA SMS verification.

## Features

### 1. Automatic Generation
- 10 backup codes automatically generated when 2FA is enabled
- Codes are 8-character alphanumeric strings
- Stored as SHA-256 hashes in the database

### 2. Secure Storage
- Codes are hashed before storage (never stored in plain text)
- Each code can only be used once
- Tracks usage timestamp when codes are consumed

### 3. User Management
- View remaining unused code count
- Download codes as text file
- Regenerate new set of codes (invalidates old ones)
- Codes displayed only once during generation

### 4. Recovery Flow
- Users can choose "Use backup code instead" during 2FA login
- Enter any unused backup code to verify identity
- Code is marked as used after successful verification
- Cannot reuse codes

## Database Schema

```sql
CREATE TABLE backup_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);
```

## Usage Flow

### Enabling 2FA
1. User enables 2FA in Settings
2. System automatically generates 10 backup codes
3. Codes are hashed and stored in database
4. User sees BackupCodesManager component
5. User can view, download, or regenerate codes

### Using Backup Codes
1. User attempts to log in
2. 2FA modal appears
3. User clicks "Use backup code instead"
4. User enters one of their backup codes
5. System verifies code hash matches
6. Code is marked as used
7. User gains access

### Managing Codes
1. Navigate to Settings page
2. Scroll to Backup Recovery Codes section
3. View remaining code count
4. Click "Generate Backup Codes" to create new set
5. Download codes for safekeeping
6. Old codes are deleted when regenerating

## Security Features

- **Hashing**: Codes stored as SHA-256 hashes
- **Single-use**: Each code can only be used once
- **Regeneration**: Old codes invalidated when new ones generated
- **Rate limiting**: Inherits 2FA rate limiting protections
- **RLS policies**: Users can only access their own codes

## Components

### BackupCodesManager
- Located in `src/components/settings/BackupCodesManager.tsx`
- Displays remaining code count
- Generates and displays new codes
- Provides download functionality
- Integrated into Settings page when 2FA is enabled

### TwoFactorModal
- Updated to support backup code verification
- Toggle between SMS and backup code input
- Hashes input and compares with stored hashes
- Marks codes as used upon successful verification

## Best Practices

1. **User Education**: Inform users to save codes securely
2. **Download Prompt**: Encourage downloading codes immediately
3. **Regeneration Warning**: Warn that regeneration invalidates old codes
4. **Remaining Count**: Display how many codes are left
5. **Usage Tracking**: Log when codes are used for audit purposes
