import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    storageBuckets: {
      diagnosis: process.env.SUPABASE_STORAGE_BUCKET_DIAGNOSIS || 'diagnosis-images',
      reports: process.env.SUPABASE_STORAGE_BUCKET_REPORTS || 'diagnosis-reports',
      profile: process.env.SUPABASE_STORAGE_BUCKET_PROFILE || 'profile-avatars',
      knowledge: process.env.SUPABASE_STORAGE_BUCKET_KNOWLEDGE || ''
    },
    functions: {
      diagnosisInfer: process.env.SUPABASE_FUNCTION_DIAGNOSIS || '',
      knowledgeChat: process.env.SUPABASE_FUNCTION_KNOWLEDGE || ''
    }
  }
};
