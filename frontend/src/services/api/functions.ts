import { apiClient } from './client';

export type DiagnosisInferencePayload = {
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  files: File[];
  model?: string;
};

export const invokeDiagnosisInference = async <TResult>(payload: DiagnosisInferencePayload): Promise<TResult> => {
  const formData = new FormData();
  formData.append('crop', payload.crop);
  formData.append('stage', payload.stage);
  formData.append('context', payload.context);
  formData.append('model', payload.model ?? '');
  formData.append('symptoms', payload.symptoms.join(','));
  payload.files.forEach((file) => formData.append('files', file));

  const { data } = await apiClient.post<{ data: TResult }>('api/functions/diagnosis', formData);
  return data;
};

export type KnowledgeRequestPayload = {
  prompt: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  files: File[];
};

export const invokeKnowledgeChat = async <TResult>(payload: KnowledgeRequestPayload): Promise<TResult> => {
  const formData = new FormData();
  formData.append('prompt', payload.prompt);
  formData.append('history', JSON.stringify(payload.history));
  payload.files.forEach((file) => formData.append('files', file));

  const { data } = await apiClient.post<{ data: TResult }>('api/functions/knowledge', formData);
  return data;
};
