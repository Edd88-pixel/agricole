import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '@/services/config';
import { getStoredTokens } from '../authTokens';

let cachedClient: SupabaseClient | null = null;
let configurationWarningEmitted = false;
const isBrowser = typeof window !== 'undefined';

const applyAuthTokens = async (client: SupabaseClient) => {
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    // Ensure realtime uses the user JWT immediately
    client.realtime.setAuth(tokens.accessToken);
  }
  if (tokens?.accessToken && tokens?.refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
    if (error) {
      console.warn('Failed to sync Supabase auth session', error.message);
    }
    return;
  }
  await client.auth.signOut();
};

const getSupabaseConfig = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';
  return { url, anonKey };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    if (!configurationWarningEmitted) {
      // eslint-disable-next-line no-console
      console.warn(
        'Supabase Realtime is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable chat streaming.'
      );
      configurationWarningEmitted = true;
    }
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        'x-client-info': 'agricole-knowledge-chat'
      }
    }
  });

  if (isBrowser) {
    const client = cachedClient;
    // Apply tokens synchronously for Realtime, then sync full session
    void applyAuthTokens(client);
    const handleTokensChanged = () => {
      void applyAuthTokens(client);
    };
    window.addEventListener('agricole-auth-tokens-changed', handleTokensChanged);
    window.addEventListener('storage', handleTokensChanged);
  }

  return cachedClient;
};

export const getSupabaseUrl = () => getSupabaseConfig().url || appConfig.apiBaseUrl;
