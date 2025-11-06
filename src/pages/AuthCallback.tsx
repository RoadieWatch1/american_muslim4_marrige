// /auth/callback
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

function parseHash(h: string) {
  const out: Record<string, string> = {};
  (h.replace(/^#/, '').split('&') || []).forEach(p => {
    const [k, v] = p.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return out;
}

export default function AuthCallback() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) New PKCE format (?code=...)
        const code = search.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          return navigate('/onboarding', { replace: true });
        }

        // 2) Hash formats
        const params = parseHash(window.location.hash || '');

        // Stock templates with access_token in hash
        if (params.access_token) {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
          return navigate('/onboarding', { replace: true });
        }

        // Our explicit OTP format
        if (params.type === 'signup' && params.token) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'signup',
            token_hash: params.token,
            email: params.email || undefined,
          });
          if (error) throw error;
          return navigate('/onboarding', { replace: true });
        }

        throw new Error('Missing code');
      } catch (e: any) {
        setErr(e?.message || 'Failed to complete sign in');
      }
    })();
  }, [search, navigate]);

  return err
    ? (<div className="mx-auto max-w-md p-6"><p className="text-red-600 font-semibold">Email confirmation failed</p><p className="text-sm text-gray-700">{err}</p></div>)
    : (<div className="mx-auto max-w-md p-6">Signing you in…</div>);
}
