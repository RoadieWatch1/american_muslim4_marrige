import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { frequency } = await req.json() // 'daily' or 'weekly'
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get users who need digests
    const now = new Date()
    const cutoffDate = new Date()
    
    if (frequency === 'daily') {
      cutoffDate.setDate(cutoffDate.getDate() - 1)
    } else if (frequency === 'weekly') {
      cutoffDate.setDate(cutoffDate.getDate() - 7)
    }

    // Find users with pending notifications
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email_notifications_enabled', true)
      .eq('notification_frequency', frequency)
      .or(`last_digest_sent_at.is.null,last_digest_sent_at.lt.${cutoffDate.toISOString()}`)

    if (usersError) throw usersError

    let sentCount = 0

    for (const user of users || []) {
      // Get pending notifications for this user
      const { data: notifications, error: notifError } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('sent', false)
        .order('created_at', { ascending: false })

      if (notifError || !notifications || notifications.length === 0) continue

      // Send digest email
      const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-notification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: user.email,
          type: 'digest',
          data: {
            frequency: frequency.charAt(0).toUpperCase() + frequency.slice(1),
            count: notifications.length,
            notifications: notifications.map(n => ({
              title: n.title,
              message: n.message,
            })),
            appUrl: SUPABASE_URL.replace('.supabase.co', ''),
          },
        }),
      })

      if (emailRes.ok) {
        // Mark notifications as sent
        await supabase
          .from('notification_queue')
          .update({ sent: true })
          .eq('user_id', user.id)
          .eq('sent', false)

        // Update last digest sent time
        await supabase
          .from('profiles')
          .update({ last_digest_sent_at: now.toISOString() })
          .eq('id', user.id)

        sentCount++
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
