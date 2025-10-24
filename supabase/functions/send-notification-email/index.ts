import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  type: 'match' | 'message' | 'wali_approval' | 'wali_invitation' | 'intro_request' | 'digest'
  data: any
}

const templates = {
  match: (data: any) => ({
    subject: '💚 You have a new match!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">You have a new match!</h2>
        <p>Assalamu Alaikum,</p>
        <p>Great news! You have a mutual match with <strong>${data.matchName}</strong>.</p>
        <p>${data.matchName} is interested in getting to know you better through our Islamic matchmaking process.</p>
        <a href="${data.appUrl}/messages" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Match</a>
        <p style="color: #666; font-size: 14px;">May Allah guide you both on this journey.</p>
      </div>
    `
  }),
  message: (data: any) => ({
    subject: `💬 New message from ${data.senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">New Message</h2>
        <p>Assalamu Alaikum,</p>
        <p>You have received a new message from <strong>${data.senderName}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0;">${data.messagePreview}</p>
        </div>
        <a href="${data.appUrl}/messages" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Read Message</a>
      </div>
    `
  }),
  wali_approval: (data: any) => ({
    subject: '✅ Wali Approval Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Wali Approval</h2>
        <p>Assalamu Alaikum,</p>
        <p>Your wali <strong>${data.waliName}</strong> has approved your connection with <strong>${data.matchName}</strong>.</p>
        <p>You can now proceed with getting to know each other better.</p>
        <a href="${data.appUrl}/messages" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Continue Conversation</a>
      </div>
    `
  }),
  wali_invitation: (data: any) => ({
    subject: '👤 Wali Invitation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Wali Invitation</h2>
        <p>Assalamu Alaikum,</p>
        <p><strong>${data.userName}</strong> has invited you to be their wali on our Islamic matchmaking platform.</p>
        <p>As a wali, you will oversee and approve their connections to ensure the process follows Islamic guidelines.</p>
        <a href="${data.appUrl}/wali-console" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
      </div>
    `
  }),
  intro_request: (data: any) => ({
    subject: '🤝 New Introduction Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Introduction Request</h2>
        <p>Assalamu Alaikum,</p>
        <p><strong>${data.requesterName}</strong> has requested an introduction with you.</p>
        <p>Please review their profile and decide if you would like to proceed.</p>
        <a href="${data.appUrl}/discover" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Request</a>
      </div>
    `
  }),
  digest: (data: any) => ({
    subject: `📬 Your ${data.frequency} Digest - ${data.count} new notifications`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Your ${data.frequency} Digest</h2>
        <p>Assalamu Alaikum,</p>
        <p>Here's what happened since your last digest:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          ${data.notifications.map((n: any) => `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
              <strong>${n.title}</strong>
              <p style="margin: 5px 0 0 0; color: #666;">${n.message}</p>
            </div>
          `).join('')}
        </div>
        <a href="${data.appUrl}/dashboard" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
      </div>
    `
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, type, data }: EmailRequest = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const template = templates[type]
    if (!template) {
      throw new Error(`Unknown email type: ${type}`)
    }

    const { subject, html } = template(data)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Nikkah Match <noreply@nikkah-match.com>',
        to: [to],
        subject,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.message || 'Failed to send email')
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
