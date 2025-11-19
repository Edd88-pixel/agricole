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
  supabase: {
    storageBuckets: {
      diagnosis: getEnvValue('VITE_SUPABASE_STORAGE_BUCKET_DIAGNOSIS', 'diagnosis-images'),
      reports: getEnvValue('VITE_SUPABASE_STORAGE_BUCKET_REPORTS', 'diagnosis-reports'),
      profile: getEnvValue('VITE_SUPABASE_STORAGE_BUCKET_PROFILE', 'profile-avatars')
    },
    functions: {
      // Utilise d'abord les variables d'env. Par défaut, aligne sur les noms réels fournis
      diagnosisInfer: getEnvValue('VITE_SUPABASE_FUNCTION_DIAGNOSIS', 'dynamic-handler'),
      knowledgeChat: getEnvValue('VITE_SUPABASE_FUNCTION_KNOWLEDGE', 'super-function')
    }
  },
  gemini: {
    // Modèle par défaut demandé: gemini-2.5-flash
    model: getEnvValue('VITE_GEMINI_MODEL', 'gemini-2.5-flash')
  }
} as const;

