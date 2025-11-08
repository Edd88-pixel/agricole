import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './client';

type AuthState = {
  session: Session | null;
  isLoading: boolean;
};

export const signIn = async (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = async (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signOut = async () => supabase.auth.signOut();

export const useAuthState = (): AuthState => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
};
