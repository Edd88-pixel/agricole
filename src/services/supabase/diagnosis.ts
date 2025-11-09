import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';
import { createSignedDiagnosisUrls, removeDiagnosisImages } from './storage';
import type { DiagnosisClass, DiagnosisResult } from '@/features/diagnosis/types/diagnosis';
import type { HistoryEntry } from '@/features/history/types/history';

const TABLE = 'diagnoses';

type DiagnosisRow = {
  id: string;
  user_id: string;
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  created_at: string;
  status: DiagnosisResult['status'];
  confidence: number;
  primary: DiagnosisClass;
  alternatives?: DiagnosisClass[] | null;
  actions?: string[] | null;
  resolved?: boolean | null;
  images?: string[] | null;
};

const mapRowToHistoryEntry = async (row: DiagnosisRow): Promise<HistoryEntry> => {
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
      images = [];
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

const ensurePostgrest = (error: PostgrestError | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

const getAuthenticatedUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};

export const fetchDiagnoses = async (): Promise<HistoryEntry[]> => {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from<DiagnosisRow>(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  ensurePostgrest(error);

  if (!data) {
    return [];
  }

  const mapped = await Promise.all((data ?? []).map((row) => mapRowToHistoryEntry(row)));
  return mapped;
};

export const insertDiagnosis = async (result: DiagnosisResult) => {
  const userId = await getAuthenticatedUserId();

  const payload = {
    id: result.id,
    user_id: userId,
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
  } satisfies DiagnosisRow;

  const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'id' });
  ensurePostgrest(error);
};

export const updateDiagnosisResolved = async (id: string, resolved: boolean) => {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from(TABLE)
    .update({ resolved })
    .eq('id', id)
    .eq('user_id', userId);
  ensurePostgrest(error);
};

type EditableFields = Pick<DiagnosisRow, 'context' | 'stage'>;

export const updateDiagnosisDetails = async (id: string, updates: EditableFields) => {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  ensurePostgrest(error);
};

export const deleteDiagnosis = async (id: string, imagePaths: string[] = []) => {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  ensurePostgrest(error);

  if (imagePaths.length > 0) {
    try {
      await removeDiagnosisImages(imagePaths);
    } catch (storageError) {
      console.error('Failed to remove diagnosis images from storage', storageError);
    }
  }
};
