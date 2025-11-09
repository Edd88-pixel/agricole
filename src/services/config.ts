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
  supabase: {
    storageBuckets: {
      diagnosis: getEnvValue('VITE_SUPABASE_STORAGE_BUCKET_DIAGNOSIS', 'diagnosis-images'),
      reports: getEnvValue('VITE_SUPABASE_STORAGE_BUCKET_REPORTS', 'diagnosis-reports'),
      profile: getEnvValue('VITE_SUPABASE_STORAGE_BUCKET_PROFILE', 'profile-avatars')
    },
    functions: {
      diagnosisInfer: getEnvValue('VITE_SUPABASE_FUNCTION_DIAGNOSIS', 'diagnosis-infer'),
      knowledgeChat: getEnvValue('VITE_SUPABASE_FUNCTION_KNOWLEDGE', 'knowledge-chat')
    }
  },
  gemini: {
    model: getEnvValue('VITE_GEMINI_MODEL', 'gemini-1.5-pro-latest')
  }
} as const;

export type AppConfig = typeof appConfig;
