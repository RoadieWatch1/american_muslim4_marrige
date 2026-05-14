import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Mail, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile, verifyEmailCode } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  // OTP entry state
  const [otp, setOtp] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Backward-compat for old link-based flow
      verifyToken(token);
    } else if (!user) {
      setStatus('error');
      setMessage('Invalid verification session');
    } else {
      // Show OTP UI by default
      setStatus('resend');
    }
  }, [searchParams, user]);

  const verifyToken = async (token: string) => {
    try {
      // Validate token exists and unused
      const { data: tokenData, error: tokenError } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .single();

      if (tokenError || !tokenData) {
        setStatus('error');
        setMessage('Invalid or expired verification link');
        return;
      }

      // Check expiration
      if (new Date(tokenData.expires_at) < new Date()) {
        setStatus('error');
        setMessage('Verification link has expired. Please use a new code.');
        return;
      }

      // Mark token as used
      await supabase
        .from('email_verification_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      // Mark profile verified
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        })
        .eq('id', tokenData.user_id);

      if (updateError) throw updateError;

      await refreshProfile();
      setStatus('success');
      setMessage('Email verified successfully! Redirecting...');

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  const handleResendCode = async () => {
    if (!user) return;

    setResending(true);
    try {
      // Use the single OTP function
      const { data, error } = await supabase.functions.invoke('send-email-otp', {
        body: { email: user.email, userId: user.id, isResend: true },
      });

      if (error || !(data as any)?.success) {
        const msg = (data as any)?.error || error?.message || 'Failed to send verification code.';
        throw new Error(msg);
      }

      toast({
        title: 'Code Sent',
        description: 'We’ve sent a 6-digit verification code to your email.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send verification code.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user) return;
    const code = otp.trim();
    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Enter the 6-digit code from your email.',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingCode(true);
    try {
      const ok = await verifyEmailCode(user.id, code);
      if (!ok) {
        toast({
          title: 'Incorrect or expired code',
          description: 'Please try again or resend a new code.',
          variant: 'destructive',
        });
        return;
      }

      setStatus('success');
      setMessage('Email verified successfully! Redirecting...');
      await refreshProfile();
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Verification failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Verify your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-teal-600 mx-auto" />
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <p className="text-green-600 font-semibold">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <XCircle className="w-16 h-16 text-red-600 mx-auto" />
                <p className="text-red-600 font-semibold">{message}</p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 text-left">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">Tip: check your spam folder.</p>
                  <p className="text-amber-800">
                    AM4M emails sometimes land in <strong>Spam</strong> or <strong>Junk</strong>. If you find it there, mark it <strong>Not Spam</strong> so future codes reach your inbox.
                  </p>
                </div>
              </div>

              {user && (
                <Button onClick={handleResendCode} disabled={resending} className="w-full">
                  {resending ? 'Sending…' : 'Resend 6-digit Code'}
                </Button>
              )}
            </div>
          )}

          {status === 'resend' && user && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Mail className="w-16 h-16 text-teal-600 mx-auto" />
                <p className="text-gray-600">
                  Enter the 6-digit code we emailed to{' '}
                  <span className="font-medium">{user.email}</span>.
                </p>
              </div>

              <input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full text-center tracking-widest text-2xl p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
              />

              <Button onClick={handleVerifyCode} disabled={verifyingCode || otp.length !== 6} className="w-full">
                {verifyingCode ? 'Verifying…' : 'Verify Code'}
              </Button>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">Don't see the email?</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-800">
                    <li>Check your <strong>Spam</strong> or <strong>Junk</strong> folder.</li>
                    <li>Search your inbox for <em>"AM4M"</em> or <em>"verification code"</em>.</li>
                    <li>If you find it in spam, mark it <strong>Not Spam</strong> so future emails arrive in your inbox.</li>
                    <li>Still nothing after a minute? Tap <strong>Resend Code</strong> below.</li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="w-full"
                >
                  {resending ? 'Sending…' : 'Resend Code'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
