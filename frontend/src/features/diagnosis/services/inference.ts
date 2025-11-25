import { appConfig } from '@/services/config';
import { invokeDiagnosisInference } from '@/services/api/functions';
import type { DiagnosisClass, DiagnosisResult } from '../types/diagnosis';

type InferenceInput = {
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  files: File[];
};

type EdgeAction = string | { label?: string; description?: string } | Record<string, unknown>;
type EdgeAlternative = Partial<DiagnosisClass> & { confidence?: number | string };

type EdgeDiagnosisResponse = Omit<DiagnosisResult, 'createdAt' | 'confidence' | 'alternatives' | 'actions'> & {
  createdAt?: string;
  confidence?: number | string;
  signedUrls?: string[];
  alternatives?: EdgeAlternative[];
  actions?: EdgeAction[];
  primary: DiagnosisClass & { confidence?: number | string };
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

  try {
    const response = await invokeDiagnosisInference<EdgeDiagnosisResponse>({
      crop: payload.crop,
      stage: payload.stage,
      symptoms: payload.symptoms,
      context: payload.context,
      files: payload.files,
      model: appConfig.gemini.model
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
        if (s === 'high' || s === 'eleve' || s === 'strong') return 0.85;
        const n = Number.parseFloat(s.replace(',', '.'));
        if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n));
      }
      return 0.5;
    };

    const signedUrls = response.signedUrls ?? [];
    const createdAt = response.createdAt ?? new Date().toISOString();
    const images = Array.isArray(response.images) && response.images.length > 0 ? response.images : signedUrls;
    const imagePaths = response.imagePaths ?? images;
    const numericConfidence = normalizeConfidence(response.confidence ?? response.primary?.confidence);
    const normalizedPrimary = { ...response.primary, confidence: numericConfidence };
    const normalizedAlternatives = (response.alternatives ?? [])
      .filter((alt): alt is EdgeAlternative & { label: string } => typeof alt.label === 'string')
      .map((alt) => ({
        label: alt.label,
        status: alt.status ?? 'stressed',
        description: alt.description ?? '',
        confidence: normalizeConfidence(alt?.confidence)
      }));

    const normalizeAction = (action: EdgeAction): string => {
      if (typeof action === 'string') return action;
      const label = typeof action.label === 'string' ? action.label : undefined;
      const description = typeof action.description === 'string' ? action.description : undefined;
      if (label && description) return `${label} - ${description}`;
      if (label) return label;
      if (description) return description;
      try {
        return JSON.stringify(action);
      } catch {
        return String(action);
      }
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
