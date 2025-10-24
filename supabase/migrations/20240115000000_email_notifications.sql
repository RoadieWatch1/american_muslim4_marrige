-- Add notification preference columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_wali_invitations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_intro_requests BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_matches BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),
ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;

-- Create notification_queue table for digest notifications
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('match', 'message', 'wali_approval', 'wali_invitation', 'intro_request')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_sent ON notification_queue(user_id, sent, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(notification_type);

-- Enable RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_queue
CREATE POLICY "Users can view their own notifications"
  ON notification_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notification_queue FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
  ON notification_queue FOR UPDATE
  USING (true);
