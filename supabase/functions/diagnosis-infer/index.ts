import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

type RequestPayload = {
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  imagePaths?: string[];
  model?: string;
};

type GeminiCandidate = {
  content?: { parts?: { text?: string }[] };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

const APP_URL = Deno.env.get('APP_URL');
const APP_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY');
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY');
const DIAGNOSIS_BUCKET = Deno.env.get('STORAGE_BUCKET_DIAGNOSIS') ?? 'diagnosis-images';

if (!APP_URL || !APP_SERVICE_KEY || !GEMINI_KEY) {
  throw new Error('Missing Supabase or Gemini configuration.');
}

const supabase = createClient(APP_URL, APP_SERVICE_KEY, {
  auth: { persistSession: false }
});

const signImageUrls = async (paths: string[]) => {
  if (paths.length === 0) return [] as string[];
  const { data, error } = await supabase.storage.from(DIAGNOSIS_BUCKET).createSignedUrls(paths, 60 * 10);
  if (error) {
    console.error('Unable to sign image URLs', error);
    return [];
  }
  return (data ?? []).map((item) => item.signedUrl);
};

const buildPrompt = (payload: RequestPayload, signedUrls: string[]) => ({
  contents: [
    {
      role: 'user',
      parts: [
        {
          text: `Culture: ${payload.crop}\nStade: ${payload.stage}\nSymptômes: ${payload.symptoms.join(
            ', '
          )}\nContexte: ${payload.context}\nImages: ${signedUrls.join(', ')}`
        },
        {
          text:
            'Retourne un JSON strict avec les clés primary {label, confidence, status, description}, alternatives[], actions[]. '
        }
      ]
    }
  ],
  generationConfig: {
    responseMimeType: 'application/json'
  }
});

const parseGemini = (payload: RequestPayload, body: GeminiResponse) => {
  const candidateText = body.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!candidateText) return null;
  try {
    const parsed = JSON.parse(candidateText) as {
      primary?: { label?: string; confidence?: number; status?: string; description?: string };
      alternatives?: { label: string; confidence: number; status: string; description?: string }[];
      actions?: string[];
    };
    if (!parsed.primary) return null;
    const confidence = parsed.primary.confidence ?? 0.6;
    return {
      crop: payload.crop,
      stage: payload.stage,
      symptoms: payload.symptoms,
      context: payload.context,
      primary: {
        label: parsed.primary.label ?? payload.crop,
        confidence,
        status: (parsed.primary.status ?? 'stressed') as 'healthy' | 'stressed' | 'sick',
        description: parsed.primary.description ?? 'AI generated hypothesis'
      },
      alternatives: parsed.alternatives ?? [],
      actions: parsed.actions ?? []
    };
  } catch (error) {
    console.error('Failed to parse Gemini response', error);
    return null;
  }
};

const runGemini = async (payload: RequestPayload, signedUrls: string[]) => {
  const model = payload.model ?? 'gemini-2.5-flash';
  const requestBody = buildPrompt(payload, signedUrls);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  );
  if (!response.ok) {
    throw new Error(`Gemini error ${response.status}`);
  }
  const json = (await response.json()) as GeminiResponse;
  return parseGemini(payload, json);
};

const buildFallback = (payload: RequestPayload) => {
  const baseConfidence = 0.55;
  const primaryLabel = `${payload.crop} stress`; // fallback label
  return {
    crop: payload.crop,
    stage: payload.stage,
    symptoms: payload.symptoms,
    context: payload.context,
    primary: {
      label: primaryLabel,
      confidence: baseConfidence,
      status: 'stressed' as const,
      description: 'Fallback generated without Gemini'
    },
    alternatives: [],
    actions: [
      'Inspecter de nouvelles photos sous différents angles',
      'Vérifier les apports hydriques et nutritifs des 48 dernières heures',
      'Programmer un suivi terrain dans 48 heures'
    ]
  };
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: RequestPayload;
  try {
    payload = (await req.json()) as RequestPayload;
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const baseResult = buildFallback(payload);
  try {
    const signedUrls = await signImageUrls(payload.imagePaths ?? []);
    const geminiResult = await runGemini(payload, signedUrls);
    const now = new Date().toISOString();
    const primary = geminiResult?.primary ?? baseResult.primary;
    return new Response(
      JSON.stringify({
        id: crypto.randomUUID(),
        crop: payload.crop,
        stage: payload.stage,
        symptoms: payload.symptoms,
        context: payload.context,
        createdAt: now,
        status: primary.status,
        confidence: primary.confidence,
        primary,
        alternatives: geminiResult?.alternatives ?? baseResult.alternatives,
        actions: geminiResult?.actions ?? baseResult.actions
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Edge inference error', error);
    return new Response(JSON.stringify({ ...baseResult, id: crypto.randomUUID(), createdAt: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
});
