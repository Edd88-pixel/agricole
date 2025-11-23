const getEnvValue = (key: string, fallback?: string) => {
  const env = import.meta.env as Record<string, string | undefined>;
  const browserValue = env[key];
  if (browserValue) {
    return browserValue;
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const appConfig = {
  apiBaseUrl: getEnvValue('VITE_API_BASE_URL', 'http://localhost:4000'),
  gemini: {
    // Modele par defaut demande: gemini-2.5-flash
    model: getEnvValue('VITE_GEMINI_MODEL', 'gemini-2.5-flash')
  },
  supabase: {
    url: getEnvValue('VITE_SUPABASE_URL'),
    anonKey: getEnvValue('VITE_SUPABASE_ANON_KEY')
  }
} as const;

