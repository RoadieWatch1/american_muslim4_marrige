// src/pages/WaliInvite.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type InviteState = 'loading' | 'needs_login' | 'ready' | 'success' | 'error';

export default function WaliInvite() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<InviteState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read token from query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');

    if (!t) {
      setErrorMessage('This wali invitation link is missing a token.');
      setState('error');
      return;
    }

    setToken(t);
  }, [location.search]);

  // Once we know auth + token, decide what to show/do
  useEffect(() => {
    if (!token) return;
    if (state === 'error') return; // already invalid token
    if (authLoading) return;

    if (!user) {
      // Wali not logged in yet
      setState('needs_login');
      return;
    }

    // Wali is logged in → attempt to accept invite (via RPC)
    void acceptInvite(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, user]);

  const acceptInvite = async (inviteToken: string) => {
    try {
      setState('loading');
      setErrorMessage(null);

      // 🔹 This RPC does not exist yet.
      // We will create `accept_wali_invite(p_invite_token uuid)` on the DB side.
      const { data, error } = await supabase.rpc('accept_wali_invite', {
        p_invite_token: inviteToken,
      });

      if (error) {
        console.error('accept_wali_invite error:', error);
        setErrorMessage(
          error.message ||
            'We could not accept this invitation. It may be invalid or expired.',
        );
        setState('error');
        return;
      }

      // Optional: data can include info about ward, etc.
      setState('success');
      toast({
        title: 'Invitation accepted',
        description: 'You are now connected as a wali for this member.',
      });

      // After a short delay, send them to dashboard (or a wali dashboard later)
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('acceptInvite unexpected error:', err);
      setErrorMessage(
        err?.message || 'Something went wrong while accepting this invitation.',
      );
      setState('error');
    }
  };

  const renderContent = () => {
    if (state === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-600 text-sm">
            Checking your wali invitation link…
          </p>
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="text-sm text-gray-700 text-center max-w-sm">
            {errorMessage ||
              'This wali invitation link is invalid, expired, or already used.'}
          </p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      );
    }

    if (state === 'needs_login') {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-gray-700 text-center max-w-sm">
            You&apos;ve been invited to act as a wali for a member on
            American Muslim 4 Marriage.
          </p>
          <p className="text-xs text-gray-500 text-center max-w-sm">
            To continue, please log in or create an account using the same
            email address where you received this invitation. After logging in,
            open this link again.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    if (state === 'success') {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-sm text-gray-700 text-center max-w-sm">
            Alhamdulillah! You&apos;re now connected as a wali for this member.
          </p>
          <p className="text-xs text-gray-500 text-center max-w-sm">
            We&apos;re redirecting you to your dashboard…
          </p>
        </div>
      );
    }

    // state === 'ready' (not really used right now but kept for future)
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Shield className="w-10 h-10 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Wali Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
