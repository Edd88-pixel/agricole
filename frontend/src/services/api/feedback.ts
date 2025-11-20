import { apiClient } from './client';

export const submitDiagnosisFeedback = async (payload: { diagnosisId: string; useful: boolean; comment?: string }) => {
  await apiClient.post(`api/diagnoses/${payload.diagnosisId}/feedback`, {
    useful: payload.useful,
    comment: payload.comment
  });
};
