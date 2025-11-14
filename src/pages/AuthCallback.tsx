// /auth/callback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/** Helper: Extract query params from hash fragments (#access_token=...) */
function parseHash(h: string) {
  const out: Record<string, string> = {};
  (h.replace(/^#/, '').split('&') || []).forEach((p) => {
    const [k, v] = p.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return out;
}

/** CREATE profile row + mark email verified */
async function ensureProfileAndVerifyEmail() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error('No authenticated user');

  const { id, email } = user;

  // Create profile row if missing, otherwise update
  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id, // REQUIRED: FK to auth.users.id
      email,
      role: 'member',
      onboarding_completed: false,
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      account_status: 'active',
      status: 'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (upsertError) throw upsertError;
}

export default function AuthCallback() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // ────────────────────────────────
        // 1) PKCE AUTH FLOW (?code=...)
        // ────────────────────────────────
        const code = search.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          await ensureProfileAndVerifyEmail();
          return navigate('/onboarding', { replace: true });
        }

        // ────────────────────────────────
        // 2) HASH TOKEN FORMATS (#access_token=...)
        // ────────────────────────────────
        const params = parseHash(window.location.hash || '');

        if (params.access_token) {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;

          await ensureProfileAndVerifyEmail();
          return navigate('/onboarding', { replace: true });
        }

        // ────────────────────────────────
        // 3) MAGIC LINK / SIGNUP VERIFY OTP
        // ────────────────────────────────
        if (params.type === 'signup' && params.token) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'signup',
            token_hash: params.token,
            email: params.email || undefined,
          });
          if (error) throw error;

          await ensureProfileAndVerifyEmail();
          return navigate('/onboarding', { replace: true });
        }

        // ────────────────────────────────
        throw new Error('Missing authentication response');
      } catch (e: any) {
        setErr(e?.message || 'Failed to complete sign in');
      }
    })();
  }, [search, navigate]);

  return err ? (
    <div className="mx-auto max-w-md p-6">
      <p className="text-red-600 font-semibold">Email confirmation failed</p>
      <p className="text-sm text-gray-700">{err}</p>
    </div>
  ) : (
    <div className="mx-auto max-w-md p-6">Signing you in…</div>
  );
}



// // /auth/callback
// import { useEffect, useState } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { supabase } from '@/lib/supabase';

// function parseHash(h: string) {
//   const out: Record<string, string> = {};
//   (h.replace(/^#/, '').split('&') || []).forEach(p => {
//     const [k, v] = p.split('=');
//     if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
//   });
//   return out;
// }

// export default function AuthCallback() {
//   const [search] = useSearchParams();
//   const navigate = useNavigate();
//   const [err, setErr] = useState<string | null>(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         // 1) New PKCE format (?code=...)
//         const code = search.get('code');
//         if (code) {
//           const { error } = await supabase.auth.exchangeCodeForSession(code);
//           if (error) throw error;
//           return navigate('/onboarding', { replace: true });
//         }

//         // 2) Hash formats
//         const params = parseHash(window.location.hash || '');

//         // Stock templates with access_token in hash
//         if (params.access_token) {
//           const { error } = await supabase.auth.getSession();
//           if (error) throw error;
//           return navigate('/onboarding', { replace: true });
//         }

//         // Our explicit OTP format
//         if (params.type === 'signup' && params.token) {
//           const { error } = await supabase.auth.verifyOtp({
//             type: 'signup',
//             token_hash: params.token,
//             email: params.email || undefined,
//           });
//           if (error) throw error;
//           return navigate('/onboarding', { replace: true });
//         }

//         throw new Error('Missing code');
//       } catch (e: any) {
//         setErr(e?.message || 'Failed to complete sign in');
//       }
//     })();
//   }, [search, navigate]);

//   return err
//     ? (<div className="mx-auto max-w-md p-6"><p className="text-red-600 font-semibold">Email confirmation failed</p><p className="text-sm text-gray-700">{err}</p></div>)
//     : (<div className="mx-auto max-w-md p-6">Signing you in…</div>);
// }
