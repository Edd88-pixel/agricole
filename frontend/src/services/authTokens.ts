export type StoredTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number | null;
};

const TOKEN_KEY = 'agricole.auth.tokens';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readStorage = (): StoredTokens | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
};

export const getStoredTokens = (): StoredTokens | null => readStorage();

export const getAccessToken = (): string | undefined => readStorage()?.accessToken;

const emitTokensChanged = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event('agricole-auth-tokens-changed'));
};

export const storeTokens = (tokens: StoredTokens) => {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  emitTokensChanged();
};

export const clearTokens = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  emitTokensChanged();
};
