import { supabase } from './supabase';

interface SMSNotificationParams {
  userId: string;
  phoneNumber: string;
  message: string;
  type: 'match' | 'wali_approval' | 'message';
}

export async function sendSMSNotification(params: SMSNotificationParams) {
  try {
    // Check if user has SMS notifications enabled
    const { data: profile } = await supabase
      .from('profiles')
      .select('sms_notifications_enabled, notify_matches_sms, notify_wali_approvals_sms, notify_messages_sms, phone_verified, last_sms_sent_at')
      .eq('id', params.userId)
      .single();

    if (!profile || !profile.sms_notifications_enabled || !profile.phone_verified) {
      return { success: false, reason: 'SMS notifications disabled or phone not verified' };
    }

    // Check type-specific preferences
    if (params.type === 'match' && !profile.notify_matches_sms) return { success: false };
    if (params.type === 'wali_approval' && !profile.notify_wali_approvals_sms) return { success: false };
    if (params.type === 'message' && !profile.notify_messages_sms) return { success: false };

    // Rate limiting: max 1 SMS per 5 minutes per user
    if (profile.last_sms_sent_at) {
      const lastSent = new Date(profile.last_sms_sent_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (lastSent > fiveMinutesAgo) {
        return { success: false, reason: 'Rate limit: wait 5 minutes between SMS' };
      }
    }

    // Send SMS via edge function
    const { data, error } = await supabase.functions.invoke('send-sms-notification', {
      body: {
        phoneNumber: params.phoneNumber,
        message: params.message,
        userId: params.userId
      }
    });

    if (error) throw error;

    // Update last SMS sent timestamp
    await supabase
      .from('profiles')
      .update({ last_sms_sent_at: new Date().toISOString() })
      .eq('id', params.userId);

    return { success: true, data };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
}

export async function notifyMatchSMS(userId: string, matchName: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', userId)
    .single();

  if (!profile?.phone_number) return;

  await sendSMSNotification({
    userId,
    phoneNumber: profile.phone_number,
    message: `🎉 New match on Nikah! ${matchName} is interested. Check your matches now.`,
    type: 'match'
  });
}

export async function notifyWaliApprovalSMS(userId: string, wardName: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', userId)
    .single();

  if (!profile?.phone_number) return;

  await sendSMSNotification({
    userId,
    phoneNumber: profile.phone_number,
    message: `✅ Wali approval needed: ${wardName} has a new match request. Review in your Wali Console.`,
    type: 'wali_approval'
  });
}
