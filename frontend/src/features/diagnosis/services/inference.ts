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

    const reqBody: Record<string, unknown> = {
      crop: payload.crop,
      stage: payload.stage,
      symptoms: payload.symptoms,
      context: payload.context,
      imagePaths: uploadedPaths,
      // compat payload keys for alternative function implementations
      images: uploadedPaths,
      signedImagePaths: uploadedPaths,
      query: `${payload.crop} | ${payload.stage}`,
      // Fournit directement des URL signées si le handler les accepte
      signedUrls
    };
    if (appConfig.gemini.model) {
      reqBody.model = appConfig.gemini.model;
    }
    const response = await invokeEdgeFunction<EdgeDiagnosisResponse>(appConfig.supabase.functions.diagnosisInfer, {
      body: reqBody
    });

    if (!response.id) {
      throw new InferenceError('Incomplete response from edge inference.');
    }

    if (!response.primary) {
      throw new InferenceError('Incomplete response from edge inference.');
    }

    const normalizeConfidence = (val: unknown): number => {
      if (typeof val === 'number' && !Number.isNaN(val)) return Math.max(0, Math.min(1, val));
      if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === 'low' || s === 'faible') return 0.25;
        if (s === 'medium' || s === 'mid' || s === 'moyen' || s === 'moderate') return 0.6;
        if (s === 'high' || s === 'eleve' || s === 'élevé' || s === 'strong') return 0.85;
        const n = Number.parseFloat(s.replace(',', '.'));
        if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n));
      }
      return 0.5;
    };

    const createdAt = response.createdAt ?? new Date().toISOString();
    const images = Array.isArray(response.images) && response.images.length > 0 ? response.images : signedUrls;
    const imagePaths = response.imagePaths ?? uploadedPaths;
    const numericConfidence = normalizeConfidence((response as any).confidence ?? (response as any).primary?.confidence);
    const normalizedPrimary = { ...response.primary, confidence: numericConfidence };
    const normalizedAlternatives = (response.alternatives ?? []).map((alt) => ({
      ...alt,
      confidence: normalizeConfidence((alt as any)?.confidence)
    }));
    const normalizeAction = (action: unknown): string => {
      if (typeof action === 'string') return action;
      if (action && typeof action === 'object') {
        const a = action as Record<string, unknown>;
        const label = typeof a.label === 'string' ? a.label : undefined;
        const description = typeof a.description === 'string' ? a.description : undefined;
        if (label && description) return `${label} — ${description}`;
        if (label) return label;
        if (description) return description;
        try { return JSON.stringify(a); } catch { return String(action); }
      }
      return String(action ?? '');
    };

    return {
      id: response.id,
      crop: response.crop ?? payload.crop,
      stage: response.stage ?? payload.stage,
      symptoms: response.symptoms ?? payload.symptoms,
      context: response.context ?? payload.context,
      createdAt,
      status: response.status ?? response.primary.status ?? 'stressed',
      confidence: numericConfidence,
      primary: normalizedPrimary,
      alternatives: normalizedAlternatives,
      actions: (response.actions ?? []).map(normalizeAction),
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
