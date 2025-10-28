import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile, verifyEmailCode } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Support old link-based flow for backward compatibility
      verifyToken(token);
    } else if (!user) {
      setStatus('error');
      setMessage('Invalid verification session');
    } else {
      // Default to OTP entry / resend code flow
      setStatus('resend');
    }
  }, [searchParams, user]);

  const verifyToken = async (token: string) => {
    try {
      // Check if token exists and is valid
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

      // Check if token is expired
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

      // Update profile to mark email as verified
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

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
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
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: {
          email: user.email,
          userId: user.id,
          isResend: true,
        },
      });

      if (error) throw error;

      toast({
        title: 'Code Sent',
        description: 'We’ve sent a 6-digit verification code to your email.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to send verification code.',
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

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
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
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-600 mx-auto" />
              <p className="text-red-600 font-semibold">{message}</p>
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
                  Enter the 6-digit code we emailed to <span className="font-medium">{user.email}</span>.
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
