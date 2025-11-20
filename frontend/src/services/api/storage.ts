import { apiClient } from './client';

export const uploadDiagnosisImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { paths } = await apiClient.post<{ paths: string[] }>('api/storage/diagnosis/upload', formData);
  return paths;
};

export const uploadKnowledgeAttachments = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { paths } = await apiClient.post<{ paths: string[] }>('api/storage/knowledge/upload', formData);
  return paths;
};

export const uploadProfileAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('files', file);
  const { path } = await apiClient.post<{ path: string }>('api/storage/profile/avatar', formData);
  return path;
};

export const createSignedDiagnosisUrls = async (paths: string[], expiresInSeconds = 600): Promise<string[]> => {
  if (paths.length === 0) return [];
  const { signedUrls } = await apiClient.post<{ signedUrls: string[] }>('api/storage/diagnosis/sign', {
    paths,
    expiresIn: expiresInSeconds
  });
  return signedUrls;
};

export const createSignedKnowledgeUrls = async (paths: string[], expiresInSeconds = 600): Promise<string[]> => {
  if (paths.length === 0) return [];
  const { signedUrls } = await apiClient.post<{ signedUrls: string[] }>('api/storage/knowledge/sign', {
    paths,
    expiresIn: expiresInSeconds
  });
  return signedUrls;
};

export const createSignedProfileUrl = async (path: string, expiresInSeconds = 600): Promise<string> => {
  const { signedUrl } = await apiClient.post<{ signedUrl: string }>('api/storage/profile/sign', {
    path,
    expiresIn: expiresInSeconds
  });
  return signedUrl;
};

export const removeDiagnosisImages = async (paths: string[]) => {
  await apiClient.delete('api/storage/diagnosis', { body: { paths } });
};

export const removeProfileAvatar = async (path: string | null | undefined) => {
  if (!path) return;
  await apiClient.delete('api/storage/profile/avatar', { body: { path } });
};
