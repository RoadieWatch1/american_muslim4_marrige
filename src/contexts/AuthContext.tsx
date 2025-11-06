import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  onboarding_completed: boolean;
  is_admin?: boolean;
  email_verified?: boolean;
  email_verified_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.is_admin === true;

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data ?? null);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── EMAIL + PASSWORD SIGNUP (sends confirmation link)
  const signUp = async (email: string, password: string) => {
    const redirect = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};




// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase';
// import type { User, Session } from '@supabase/supabase-js';

// interface Profile {
//   id: string;
//   email?: string;
//   phone?: string;
//   role: string;
//   first_name?: string;
//   last_name?: string;
//   gender?: string;
//   onboarding_completed: boolean;
//   is_admin?: boolean;
//   email_verified?: boolean;
//   email_verified_at?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   profile: Profile | null;
//   session: Session | null;
//   loading: boolean;
//   isAdmin: boolean;
//   signUp: (email: string, password: string) => Promise<any>;
//   signIn: (email: string, password: string) => Promise<void>;
//   sendVerificationCode: (email: string, userId?: string) => Promise<void>;
//   verifyEmailCode: (userId: string, code: string) => Promise<boolean>;
//   signOut: () => Promise<void>;
//   refreshProfile: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   const isAdmin = profile?.is_admin === true;

//   const fetchProfile = async (userId: string) => {
//     const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
//     setProfile(data ?? null);
//   };

//   useEffect(() => {
//     (async () => {
//       const { data: { session } } = await supabase.auth.getSession();
//       setSession(session ?? null);
//       setUser(session?.user ?? null);
//       if (session?.user) await fetchProfile(session.user.id);
//       setLoading(false);
//     })();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session ?? null);
//       setUser(session?.user ?? null);
//       if (session?.user) {
//         fetchProfile(session.user.id);
//       } else {
//         setProfile(null);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const signUp = async (email: string, password: string) => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       // We rely on our OTP flow; keeping redirect is harmless but optional.
//       options: { emailRedirectTo: `${window.location.origin}/verify-email` },
//     });
//     if (error) throw error;
//     return data;
//   };

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) throw error;
//   };

//   /**
//    * Send a 6-digit OTP via Edge Function `send-email-otp`.
//    * The function accepts { email, userId } and returns { success: true } (plus optional emailWarning).
//    */
//   const sendVerificationCode = async (email: string, userId?: string) => {
//     const uid = userId ?? user?.id;
//     if (!email) throw new Error('Email required');
//     if (!uid) throw new Error('User ID required');

//     // Primary path: invoke the function by name
//     const { data, error } = await supabase.functions.invoke('send-email-otp', {
//       body: { email, userId: uid },
//     });

//     // Handle supabase error or unsuccessful payload
//     if (error || !(data as any)?.success) {
//       const msg =
//         (data as any)?.error ||
//         error?.message ||
//         'Failed to send verification code';
//       throw new Error(msg);
//     }
//   };

//   /**
//    * Verify OTP stored in `email_verification_tokens`.
//    * We check the `token` column (function also writes `code` for compatibility).
//    */
//   const verifyEmailCode = async (userId: string, code: string) => {
//     const { data, error } = await supabase
//       .from('email_verification_tokens')
//       .select('*')
//       .eq('user_id', userId)
//       .eq('token', code)
//       .gte('expires_at', new Date().toISOString())
//       .single();

//     if (error || !data) return false;

//     await supabase
//       .from('profiles')
//       .update({
//         email_verified: true,
//         email_verified_at: new Date().toISOString(),
//       })
//       .eq('id', userId);

//     await supabase
//       .from('email_verification_tokens')
//       .delete()
//       .eq('user_id', userId)
//       .eq('token', code);

//     return true;
//   };

//   const signOut = async () => {
//     await supabase.auth.signOut();
//   };

//   const refreshProfile = async () => {
//     if (user) await fetchProfile(user.id);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         profile,
//         session,
//         loading,
//         isAdmin,
//         signUp,
//         signIn,
//         sendVerificationCode,
//         verifyEmailCode,
//         signOut,
//         refreshProfile,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within AuthProvider');
//   return context;
// };
