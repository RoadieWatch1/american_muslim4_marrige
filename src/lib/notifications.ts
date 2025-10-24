import { supabase } from './supabase';

interface NotificationData {
  userId: string;
  type: 'match' | 'message' | 'wali_approval' | 'wali_invitation' | 'intro_request';
  title: string;
  message: string;
  metadata?: any;
}

export async function sendNotification(data: NotificationData) {
  try {
    // Get user's notification preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, email_notifications_enabled, notification_frequency, notify_matches, notify_messages, notify_wali_invitations, notify_intro_requests')
      .eq('id', data.userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return;
    }

    // Check if notifications are enabled
    if (!profile.email_notifications_enabled) {
      return;
    }

    // Check if this specific notification type is enabled
    const typeEnabled = {
      match: profile.notify_matches,
      message: profile.notify_messages,
      wali_approval: profile.notify_wali_invitations,
      wali_invitation: profile.notify_wali_invitations,
      intro_request: profile.notify_intro_requests,
    }[data.type];

    if (!typeEnabled) {
      return;
    }

    // If instant notifications, send immediately
    if (profile.notification_frequency === 'instant') {
      await sendInstantEmail(profile.email, data);
    } else {
      // Queue for digest
      await queueNotification(data);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

async function sendInstantEmail(email: string, data: NotificationData) {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        to: email,
        type: data.type,
        data: {
          ...data.metadata,
          appUrl: window.location.origin,
        },
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending instant email:', error);
  }
}

async function queueNotification(data: NotificationData) {
  try {
    const { error } = await supabase
      .from('notification_queue')
      .insert({
        user_id: data.userId,
        notification_type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error queueing notification:', error);
  }
}

// Helper functions for specific notification types
export async function notifyNewMatch(userId: string, matchName: string) {
  await sendNotification({
    userId,
    type: 'match',
    title: 'New Match!',
    message: `You have a mutual match with ${matchName}`,
    metadata: { matchName },
  });
}

export async function notifyNewMessage(userId: string, senderName: string, messagePreview: string) {
  await sendNotification({
    userId,
    type: 'message',
    title: 'New Message',
    message: `${senderName}: ${messagePreview}`,
    metadata: { senderName, messagePreview },
  });
}

export async function notifyWaliApproval(userId: string, waliName: string, matchName: string) {
  await sendNotification({
    userId,
    type: 'wali_approval',
    title: 'Wali Approval',
    message: `${waliName} has approved your connection with ${matchName}`,
    metadata: { waliName, matchName },
  });
}

export async function notifyWaliInvitation(userId: string, userName: string) {
  await sendNotification({
    userId,
    type: 'wali_invitation',
    title: 'Wali Invitation',
    message: `${userName} has invited you to be their wali`,
    metadata: { userName },
  });
}

export async function notifyIntroRequest(userId: string, requesterName: string) {
  await sendNotification({
    userId,
    type: 'intro_request',
    title: 'Introduction Request',
    message: `${requesterName} has requested an introduction`,
    metadata: { requesterName },
  });
}
