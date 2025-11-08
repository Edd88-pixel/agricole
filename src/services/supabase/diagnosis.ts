import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';
import type { DiagnosisClass, DiagnosisResult } from '@/features/diagnosis/types/diagnosis';
import type { HistoryEntry } from '@/features/history/types/history';

const TABLE = 'diagnoses';

type DiagnosisRow = {
  id: string;
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
};

const mapRowToHistoryEntry = (row: DiagnosisRow): HistoryEntry => {
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
    resolved: row.resolved ?? false
  };
};

const ensurePostgrest = (error: PostgrestError | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

export const fetchDiagnoses = async (): Promise<HistoryEntry[]> => {
  const { data, error } = await supabase
    .from<DiagnosisRow>(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  ensurePostgrest(error);

  if (!data) {
    return [];
  }

  return data.map(mapRowToHistoryEntry);
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
    resolved: false
  } satisfies DiagnosisRow;

  const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'id' });
  ensurePostgrest(error);
};

export const updateDiagnosisResolved = async (id: string, resolved: boolean) => {
  const { error } = await supabase
    .from(TABLE)
    .update({ resolved })
    .eq('id', id);
  ensurePostgrest(error);
};
