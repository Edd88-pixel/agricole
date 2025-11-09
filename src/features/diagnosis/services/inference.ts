import { invokeEdgeFunction } from '@/services/supabase/functions';
import { createSignedDiagnosisUrls, uploadDiagnosisImages } from '@/services/supabase/storage';
import { appConfig } from '@/services/config';
import type { DiagnosisResult } from '../types/diagnosis';

type InferenceInput = {
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  files: File[];
};

type EdgeDiagnosisResponse = Omit<DiagnosisResult, 'createdAt'> & {
  createdAt?: string;
};

class InferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InferenceError';
  }
}

export const runInference = async (payload: InferenceInput): Promise<DiagnosisResult> => {
  if (!payload.files || payload.files.length === 0) {
    throw new InferenceError('At least one image is required for inference.');
  }

  if (!appConfig.supabase.functions.diagnosisInfer) {
    throw new InferenceError('Diagnosis edge function is not configured.');
  }

  try {
    const uploadedPaths = await uploadDiagnosisImages(payload.files);
    if (uploadedPaths.length === 0) {
      throw new InferenceError('No images were uploaded to Supabase storage.');
    }

    const signedUrls = await createSignedDiagnosisUrls(uploadedPaths);
    if (signedUrls.length === 0) {
      throw new InferenceError('Unable to create signed URLs for uploaded images.');
    }

    const response = await invokeEdgeFunction<EdgeDiagnosisResponse>(
      appConfig.supabase.functions.diagnosisInfer,
      {
        body: {
          crop: payload.crop,
          stage: payload.stage,
          symptoms: payload.symptoms,
          context: payload.context,
          imagePaths: uploadedPaths,
          model: appConfig.gemini.model
        }
      }
    );

    if (!response.id) {
      throw new InferenceError('Incomplete response from edge inference.');
    }

    if (!response.primary) {
      throw new InferenceError('Incomplete response from edge inference.');
    }

    const createdAt = response.createdAt ?? new Date().toISOString();
    const images = Array.isArray(response.images) && response.images.length > 0 ? response.images : signedUrls;
    const imagePaths = response.imagePaths ?? uploadedPaths;

    return {
      id: response.id,
      crop: response.crop ?? payload.crop,
      stage: response.stage ?? payload.stage,
      symptoms: response.symptoms ?? payload.symptoms,
      context: response.context ?? payload.context,
      createdAt,
      status: response.status ?? response.primary.status ?? 'stressed',
      confidence: response.confidence ?? response.primary.confidence ?? 0.5,
      primary: response.primary,
      alternatives: response.alternatives ?? [],
      actions: response.actions ?? [],
      images,
      imagePaths
    } satisfies DiagnosisResult;
  } catch (error) {
    console.error('Edge inference failed', error);
    if (error instanceof InferenceError) {
      throw error;
    }
    throw new InferenceError((error as Error).message);
  }
};
