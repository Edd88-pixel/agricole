import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './client';

type AuthState = {
  session: Session | null;
  isLoading: boolean;
};

export const signIn = async (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

type SignUpPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

const buildFullName = (firstName?: string, lastName?: string) => {
  const parts = [firstName?.trim(), lastName?.trim()].filter((value) => value && value.length > 0);
  if (parts.length === 0) return undefined;
  return parts.join(' ');
};

export const signUp = async ({ email, password, firstName, lastName }: SignUpPayload) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName?.trim() || undefined,
        last_name: lastName?.trim() || undefined,
        full_name: buildFullName(firstName, lastName)
      }
    }
  });

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
