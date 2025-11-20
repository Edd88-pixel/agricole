import { apiClient } from './client';
import { createSignedDiagnosisUrls, removeDiagnosisImages } from './storage';
import type { DiagnosisClass, DiagnosisResult } from '@/features/diagnosis/types/diagnosis';
import type { HistoryEntry } from '@/features/history/types/history';

const mapRowToHistoryEntry = async (row: any): Promise<HistoryEntry> => {
  const status = row.status ?? 'pending';
  const confidence = row.confidence ?? 0.5;
  const primary =
    row.primary ??
    ({
      label: row.crop,
      confidence,
      status: status === 'pending' ? 'healthy' : status,
      description: 'Primary hypothesis'
    } satisfies DiagnosisClass);

  let images: string[] = [];
  if (row.images && row.images.length > 0) {
    try {
      images = await createSignedDiagnosisUrls(row.images);
    } catch (error) {
      console.error('Failed to sign diagnosis images', error);
    }
  }

  return {
    id: row.id,
    crop: row.crop,
    stage: row.stage,
    symptoms: row.symptoms,
    context: row.context,
    createdAt: row.created_at,
    status,
    confidence,
    primary,
    alternatives: row.alternatives ?? [],
    actions: row.actions ?? [],
    resolved: row.resolved ?? false,
    images,
    imagePaths: row.images ?? []
  };
};

export const fetchDiagnoses = async (): Promise<HistoryEntry[]> => {
  const { data } = await apiClient.get<{ data: any[] }>('api/diagnoses');
  const rows = data ?? [];
  if (rows.length === 0) return [];
  return Promise.all(rows.map((row) => mapRowToHistoryEntry(row)));
};

export const insertDiagnosis = async (result: DiagnosisResult) => {
  const payload = {
    id: result.id,
    crop: result.crop,
    stage: result.stage,
    symptoms: result.symptoms,
    context: result.context,
    created_at: result.createdAt,
    status: result.status,
    confidence: result.confidence,
    primary: result.primary,
    alternatives: result.alternatives,
    actions: result.actions,
    images: result.imagePaths ?? result.images,
    resolved: false
  };

  await apiClient.post('api/diagnoses', payload);
};

export const updateDiagnosisResolved = async (id: string, resolved: boolean) => {
  await apiClient.patch(`api/diagnoses/${id}/resolved`, { resolved });
};

export const updateDiagnosisDetails = async (id: string, updates: { context: string; stage: string }) => {
  await apiClient.patch(`api/diagnoses/${id}`, updates);
};

export const deleteDiagnosis = async (id: string, imagePaths: string[] = []) => {
  await apiClient.delete(`api/diagnoses/${id}`, { body: { imagePaths } });
  if (imagePaths.length > 0) {
    try {
      await removeDiagnosisImages(imagePaths);
    } catch (error) {
      console.error('Failed to remove diagnosis images from backend storage', error);
    }
  }
};
