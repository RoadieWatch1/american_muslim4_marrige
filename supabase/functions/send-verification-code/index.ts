import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, userId } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Required environment variables not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .upsert({
        user_id: userId,
        token: verificationCode,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (tokenError) throw tokenError;

    // Send email via Resend with 6-digit code
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Nikah Connect <noreply@nikahconnect.com>',
        to: [email],
        subject: 'Your Verification Code - Nikah Connect',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0d9488; margin: 0;">Nikah Connect</h1>
              <p style="color: #666; margin-top: 5px;">Islamic Matchmaking Platform</p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
              <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
              <p style="color: #666; margin-bottom: 30px;">Enter this code to complete your registration:</p>
              
              <div style="background: white; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #0d9488; letter-spacing: 8px;">
                  ${verificationCode}
                </span>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                This code will expire in 10 minutes
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>If you didn't request this code, please ignore this email.</p>
              <p style="margin-top: 20px;">© 2024 Nikah Connect. All rights reserved.</p>
            </div>
          </div>
        `
      })
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error('Resend API error:', errorText);
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent to your email'
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in send-verification-code:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send verification email'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});