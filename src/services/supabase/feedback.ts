import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';

const TABLE = 'diagnosis_feedback';

type FeedbackInsert = {
  diagnosis_id: string;
  useful: boolean;
  comment?: string | null;
};

const mapPayload = (payload: { diagnosisId: string; useful: boolean; comment?: string }): FeedbackInsert => ({
  diagnosis_id: payload.diagnosisId,
  useful: payload.useful,
  comment: payload.comment ?? null
});

const ensurePostgrest = (error: PostgrestError | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

export const submitDiagnosisFeedback = async (payload: {
  diagnosisId: string;
  useful: boolean;
  comment?: string;
}) => {
  const mapped = mapPayload(payload);
  const { error } = await supabase.from<FeedbackInsert>(TABLE).insert(mapped);
  ensurePostgrest(error);
};
