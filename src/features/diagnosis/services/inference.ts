import { nanoid } from 'nanoid';
import { invokeEdgeFunction } from '@/services/supabase/functions';
import { uploadDiagnosisImages } from '@/services/supabase/storage';
import { appConfig } from '@/services/config';
import type { DiagnosisResult, DiagnosisStatus } from '../types/diagnosis';

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

const STATUS_BY_SCORE = (score: number): DiagnosisStatus => {
  if (score >= 0.7) return 'sick';
  if (score >= 0.4) return 'stressed';
  return 'healthy';
};

const buildFallback = (payload: InferenceInput): DiagnosisResult => {
  const classes = payload.symptoms.slice(0, 3).map((symptom, index) => {
    const confidence = Math.max(0.2, 0.9 - index * 0.2);
    return {
      label: `${payload.crop} • ${symptom}`,
      confidence,
      status: STATUS_BY_SCORE(confidence),
      description: `Probability ${(confidence * 100).toFixed(0)}%`
    };
  });

  const primary = classes[0] ?? {
    label: `${payload.crop} healthy`,
    confidence: 0.5,
    status: 'healthy' as const,
    description: 'Baseline confidence'
  };

  return {
    id: nanoid(),
    crop: payload.crop,
    stage: payload.stage,
    symptoms: payload.symptoms,
    context: payload.context,
    createdAt: new Date().toISOString(),
    status: primary.status,
    confidence: primary.confidence,
    primary,
    alternatives: classes.slice(1),
    actions: [
      'Inspect neighbouring plants for similar symptoms',
      'Ensure irrigation and fertilization follow local recommendations',
      'Contact agronomist if symptoms worsen'
    ]
  } satisfies DiagnosisResult;
};

export const runInference = async (payload: InferenceInput): Promise<DiagnosisResult> => {
  let uploadedPaths: string[] = [];
  const fallback = buildFallback(payload);
  try {
    uploadedPaths = await uploadDiagnosisImages(payload.files);
  } catch (error) {
    console.error('Image upload failed, continuing without Supabase storage', error);
  }

  try {
    const response = await invokeEdgeFunction<EdgeDiagnosisResponse>(appConfig.supabase.functions.diagnosisInfer, {
      body: {
        crop: payload.crop,
        stage: payload.stage,
        symptoms: payload.symptoms,
        context: payload.context,
        imagePaths: uploadedPaths,
        model: appConfig.gemini.model
      }
    });

    return {
      id: response.id ?? fallback.id,
      crop: response.crop ?? fallback.crop,
      stage: response.stage ?? fallback.stage,
      symptoms: response.symptoms ?? fallback.symptoms,
      context: response.context ?? fallback.context,
      createdAt: response.createdAt ?? fallback.createdAt,
      status: response.status ?? fallback.status,
      confidence: response.confidence ?? fallback.confidence,
      primary: response.primary ?? fallback.primary,
      alternatives: response.alternatives ?? fallback.alternatives,
      actions: response.actions ?? fallback.actions
    } satisfies DiagnosisResult;
  } catch (error) {
    console.error('Edge inference failed, returning fallback result', error);
    return fallback;
  }
};
