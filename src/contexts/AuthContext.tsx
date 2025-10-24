import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

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
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<void>;
  sendVerificationCode: (email: string, userId: string) => Promise<void>;
  verifyEmailCode: (userId: string, code: string) => Promise<boolean>;
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
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/verify-email'
      }
    });
    
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
  };

  const sendVerificationCode = async (email: string, userId: string) => {
    const { data, error } = await supabase.functions.invoke('send-verification-email', {
      body: { email, userId }
    });
    
    if (error || !data?.success) {
      throw new Error(data?.error || 'Failed to send verification code');
    }
  };

  const verifyEmailCode = async (userId: string, code: string) => {
    // Check if the code matches
    const { data, error } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token', code)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return false;
    
    // Update profile to mark email as verified
    await supabase
      .from('profiles')
      .update({ 
        email_verified: true,
        email_verified_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    // Delete the used token
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId);
    
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      isAdmin, 
      signUp,
      signIn,
      sendVerificationCode,
      verifyEmailCode,
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};