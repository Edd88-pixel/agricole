import { useEffect, useState } from 'react';
import { apiClient } from './client';
import { clearTokens, getStoredTokens, storeTokens, type StoredTokens } from '../authTokens';

export type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export type AuthSession = {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number | null;
};

export const signIn = async (email: string, password: string) => {
  const response = await apiClient.post<AuthSession>('api/auth/sign-in', { email, password });
  storeTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: response.expiresAt
  });
  return response;
};

export const signUp = async ({
  email,
  password,
  firstName,
  lastName
}: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) => {
  const response = await apiClient.post<AuthSession>('api/auth/sign-up', {
    email,
    password,
    firstName,
    lastName
  });
  storeTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: response.expiresAt
  });
  return response;
};

export const fetchCurrentUser = async (token?: string) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { user } = await apiClient.get<{ user: AuthUser }>('api/auth/me', { headers });
  return user;
};

export const signOut = async () => {
  const stored = getStoredTokens();
  try {
    await apiClient.post('api/auth/sign-out', { refreshToken: stored?.refreshToken });
  } catch (error) {
    console.error('Failed to call sign-out endpoint', error);
  }
  clearTokens();
};

export const useAuthState = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokens = getStoredTokens();
    if (!tokens?.accessToken) {
      setIsLoading(false);
      return;
    }

    const hydrate = async (stored: StoredTokens) => {
      try {
        const user = await fetchCurrentUser(stored.accessToken);
        setSession({
          user,
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          expiresAt: stored.expiresAt
        });
      } catch (error) {
        console.error('Failed to hydrate user from backend', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate(tokens);
  }, []);

  return { session, isLoading };
};
