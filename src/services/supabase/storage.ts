import { nanoid } from 'nanoid';
import { supabase } from './client';
import { appConfig } from '@/services/config';

const DIAGNOSIS_BUCKET = appConfig.supabase.storageBuckets.diagnosis;

const inferExtension = (file: File) => {
  const parts = file.name.split('.');
  const candidate = parts[parts.length - 1];
  if (!candidate) return 'jpg';
  return candidate.toLowerCase();
};

export const uploadDiagnosisImages = async (files: File[]): Promise<string[]> => {
  if (files.length === 0) {
    return [];
  }

  const { data } = await supabase.auth.getUser();
  const owner = data.user?.id ?? 'anonymous';
  const uploaded: string[] = [];

  for (const file of files) {
    const path = `${owner}/${Date.now()}-${nanoid()}.${inferExtension(file)}`;
    const { error } = await supabase.storage.from(DIAGNOSIS_BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
      cacheControl: '3600'
    });

    if (error) {
      throw new Error(error.message);
    }

    uploaded.push(path);
  }

  return uploaded;
};

export { DIAGNOSIS_BUCKET };
