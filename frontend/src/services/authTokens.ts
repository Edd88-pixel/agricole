export type StoredTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number | null;
};

const TOKEN_KEY = 'agrisense.auth.tokens';
const LEGACY_TOKEN_KEY = 'agricole.auth.tokens';
export const AUTH_TOKENS_CHANGED_EVENT = 'agrisense-auth-tokens-changed';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readStorage = (): StoredTokens | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!raw) return null;
  try {
    const tokens = JSON.parse(raw) as StoredTokens;
    if (!localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, raw);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
    return tokens;
  } catch {
    return null;
  }
};

export const getStoredTokens = (): StoredTokens | null => readStorage();

export const getAccessToken = (): string | undefined => readStorage()?.accessToken;

const emitTokensChanged = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED_EVENT));
};

export const storeTokens = (tokens: StoredTokens) => {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  emitTokensChanged();
};

export const clearTokens = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  emitTokensChanged();
};
