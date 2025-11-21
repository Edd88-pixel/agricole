import { apiClient } from './client';

export type DiagnosisInferencePayload = {
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  files: File[];
  model?: string;
};

const LONG_FUNCTION_TIMEOUT_MS = 120000000;

export const invokeDiagnosisInference = async <TResult>(payload: DiagnosisInferencePayload): Promise<TResult> => {
  const formData = new FormData();
  formData.append('crop', payload.crop);
  formData.append('stage', payload.stage);
  formData.append('context', payload.context);
  formData.append('model', payload.model ?? '');
  formData.append('symptoms', payload.symptoms.join(','));
  payload.files.forEach((file) => formData.append('files', file));

  const { data } = await apiClient.post<{ data: TResult }>('api/functions/diagnosis', formData, {
    // Edge inference can take longer when uploading multiple images; allow more time before aborting.
    timeoutMs: LONG_FUNCTION_TIMEOUT_MS
  });
  return data;
};

export type KnowledgeRequestPayload = {
  prompt: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  files?: File[];
};

export const invokeKnowledgeChat = async <TResult>(payload: KnowledgeRequestPayload): Promise<TResult> => {
  const formData = new FormData();
  formData.append('prompt', payload.prompt);
  formData.append('history', JSON.stringify(payload.history));
  (payload.files ?? []).forEach((file) => formData.append('files', file));

  const { data } = await apiClient.post<{ data: TResult }>('api/functions/knowledge', formData, {
    // Knowledge chat can take time when files/history are large; allow a generous timeout.
    timeoutMs: LONG_FUNCTION_TIMEOUT_MS
  });
  return data;
};
