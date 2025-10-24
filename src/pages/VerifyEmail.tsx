import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyToken(token);
    } else if (!user) {
      setStatus('error');
      setMessage('Invalid verification link');
    } else {
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
        setMessage('Verification link has expired. Please request a new one.');
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
          email_verified_at: new Date().toISOString()
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

  const handleResendEmail = async () => {
    if (!user) return;

    setResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { 
          email: user.email, 
          userId: user.id,
          isResend: true 
        }
      });

      if (error) throw error;

      toast({
        title: 'Email Sent',
        description: 'Verification email has been sent. Please check your inbox.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send verification email',
        variant: 'destructive'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Email Verification</CardTitle>
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
                <Button onClick={handleResendEmail} disabled={resending} className="w-full">
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              )}
            </div>
          )}

          {status === 'resend' && (
            <div className="text-center space-y-4">
              <Mail className="w-16 h-16 text-teal-600 mx-auto" />
              <p className="text-gray-600">Please verify your email to continue</p>
              <Button onClick={handleResendEmail} disabled={resending} className="w-full">
                {resending ? 'Sending...' : 'Send Verification Email'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
