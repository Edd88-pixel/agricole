import { nanoid } from 'nanoid';
import { supabase } from './client';
import { appConfig } from '@/services/config';

const DIAGNOSIS_BUCKET = appConfig.supabase.storageBuckets.diagnosis ?? 'diagnosis-images';
const PROFILE_BUCKET = appConfig.supabase.storageBuckets.profile ?? 'profile-avatars';

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

const ensureUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User must be authenticated to upload media.');
  }
  return userId;
};

export const createSignedDiagnosisUrls = async (paths: string[], expiresInSeconds = 60 * 10) => {
  if (paths.length === 0) return [] as string[];

  const { data, error } = await supabase.storage
    .from(DIAGNOSIS_BUCKET)
    .createSignedUrls(paths, expiresInSeconds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item: { signedUrl: string }) => item.signedUrl);
};

export const removeDiagnosisImages = async (paths: string[]) => {
  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(DIAGNOSIS_BUCKET).remove(paths);
  if (error) {
    throw new Error(error.message);
  }
};

export const uploadProfileAvatar = async (file: File): Promise<string> => {
  const owner = await ensureUser();
  const path = `${owner}/avatar-${Date.now()}.${inferExtension(file)}`;
  const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
    cacheControl: '3600'
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
};

export const createSignedProfileUrl = async (path: string, expiresInSeconds = 60 * 10): Promise<string> => {
  if (!path) {
    throw new Error('No avatar path provided.');
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(error.message);
  }

  return data?.signedUrl ?? '';
};

export const removeProfileAvatar = async (path: string | null | undefined) => {
  if (!path) return;

  const { error } = await supabase.storage.from(PROFILE_BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
};
