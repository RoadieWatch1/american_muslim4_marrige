/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  subscription_status: string;
  wali_required: any;
  profile_photo_url: any;
  subscription_tier: string;
  dob: any;
  city: string;
  state: string;
  occupation: string;
  bio: string;
  practice_level: string;
  prayer_frequency: string;
  nikah_timeline: string;
  denomination: string;
  marital_status: string;
  has_children: boolean;
  education: string;
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

  // ✅ optional (we’re going to start using it)
  last_seen_at?: string | null;
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

  const heartbeatTimerRef = useRef<number | null>(null);
  const lastPingRef = useRef<number>(0);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile', error);
      setProfile(null);
      return;
    }

    setProfile(data ?? null);
  };

  // ✅ Update last_seen_at (throttled)
  const pingLastSeen = async (userId: string) => {
    // throttle: don’t update more than once every 15s (extra safety)
    const now = Date.now();
    if (now - lastPingRef.current < 15_000) return;
    lastPingRef.current = now;

    const { error } = await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      // don’t spam console too much, but keep it visible for debugging
      console.warn('last_seen_at update failed:', error.message);
    }
  };

  // Session init + auth state changes
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // ✅ Heartbeat: while logged in, keep updating last_seen_at
  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      // cleanup if logged out
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      return;
    }

    // immediate ping on login
    void pingLastSeen(userId);

    // ping every 30s
    heartbeatTimerRef.current = window.setInterval(() => {
      void pingLastSeen(userId);
    }, 30_000);

    // also ping when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void pingLastSeen(userId);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [user?.id]);

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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




// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import type { User, Session } from '@supabase/supabase-js';
// import { supabase } from '@/lib/supabase';

// interface Profile {
//   subscription_status: string;
//   wali_required: any;
//   profile_photo_url: any;
//   subscription_tier: string;
//   dob: any;
//   city: string;
//   state: string;
//   occupation: string;
//   bio: string;
//   practice_level: string;
//   prayer_frequency: string;
//   nikah_timeline: string;
//   denomination: string;
//   marital_status: string;
//   has_children: boolean;
//   education: string;
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
//   signUp: (email: string, password: string) => Promise<void>;
//   signIn: (email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   refreshProfile: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   const isAdmin = profile?.is_admin === true;

//   const fetchProfile = async (userId: string) => {
//     const { data, error } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .maybeSingle(); // ✅ no 406 when 0 rows

//     if (error) {
//       console.error('Error fetching profile', error);
//       setProfile(null);
//       return;
//     }

//     setProfile(data ?? null);
//   };

//   useEffect(() => {
//     (async () => {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       setSession(session ?? null);
//       setUser(session?.user ?? null);
//       if (session?.user) await fetchProfile(session.user.id);
//       setLoading(false);
//     })();

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
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

//   // ── EMAIL + PASSWORD SIGNUP (sends confirmation link)
//   const signUp = async (email: string, password: string) => {
//     const redirect = `${window.location.origin}/auth/callback`;
//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { emailRedirectTo: redirect },
//     });
//     if (error) throw error;
//   };

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     if (error) throw error;
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
