import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: sessionData },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(sessionData);

          if (sessionData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionData.user.id)
              .maybeSingle();

            if (profileData && mounted) {
              setUser(profileData);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, sessionData) => {
      if (mounted) {
        setSession(sessionData);

        if (sessionData) {
          (async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionData.user.id)
              .maybeSingle();

            if (profileData && mounted) {
              setUser(profileData);
            }
          })();
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        return { error: signUpError.message };
      }

      if (!signUpData.user?.id) {
        return { error: 'Failed to create user' };
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (profileError) {
        return { error: profileError.message };
      }

      return { error: null };
    } catch (error) {
      return { error: (error as Error).message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: (error as Error).message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
