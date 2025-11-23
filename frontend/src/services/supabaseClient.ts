import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '@/services/config';
import { getStoredTokens } from './authTokens';

const isBrowser = typeof window !== 'undefined';

const applyStoredSession = async (client: SupabaseClient) => {
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    client.realtime.setAuth(tokens.accessToken);
  }
  if (tokens?.accessToken && tokens?.refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
    if (error) {
      console.warn('Failed to sync Supabase session', error.message);
    }
    return;
  }
  // ensure we don't keep an expired/anonymous session when tokens are cleared
  await client.auth.signOut();
};

const buildClient = (): SupabaseClient | null => {
  if (!appConfig.supabase.url || !appConfig.supabase.anonKey) {
    console.warn('Supabase configuration is missing; realtime knowledge assistant disabled.');
    return null;
  }

  const client = createClient(appConfig.supabase.url, appConfig.supabase.anonKey, {
    realtime: {
      params: { eventsPerSecond: 5 }
    }
  });

  if (isBrowser) {
    const supabase = client;
    void applyStoredSession(supabase);
    const syncSession = () => {
      void applyStoredSession(supabase);
    };
    window.addEventListener('agricole-auth-tokens-changed', syncSession);
    window.addEventListener('storage', syncSession);
  }

  return client;
};

export const supabaseClient = buildClient();
