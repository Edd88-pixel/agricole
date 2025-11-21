import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

const buildCors = (req: Request): HeadersInit => {
  const origin = req.headers.get('origin') ?? '*';
  const requested =
    req.headers.get('access-control-request-headers') ?? 'authorization, x-client-info, apikey, content-type';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': requested,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin'
  } as const;
};

type RequestPayload = {
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  imagePaths?: string[];
  signedUrls?: string[];
  model?: string;
};

type GeminiCandidate = {
  content?: { parts?: { text?: string }[] };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

const pickEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value) return value;
  }
  return undefined;
};

const SUPABASE_URL = pickEnv('SUPABASE_URL', 'APP_URL');
const SUPABASE_SERVICE_KEY = pickEnv(
  'SUPABASE_SERVICE_ROLE_KEY',
  'APP_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY'
);
const GEMINI_KEY = pickEnv('GEMINI_API_KEY', 'SUPABASE_GEMINI_API_KEY');
const DIAGNOSIS_BUCKET =
  pickEnv('SUPABASE_STORAGE_BUCKET_DIAGNOSIS', 'VITE_SUPABASE_STORAGE_BUCKET_DIAGNOSIS', 'STORAGE_BUCKET_DIAGNOSIS') ??
  'diagnosis-images';

if (!GEMINI_KEY) {
  throw new Error('Missing Gemini configuration.');
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false }
      })
    : null;

const signImageUrls = async (paths: string[]) => {
  if (paths.length === 0 || !supabase) return [] as string[];
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
    throw new Error(`Inference error ${response.status}`);
  }
  const json = (await response.json()) as GeminiResponse;
  return parseGemini(payload, json);
};

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  let payload: RequestPayload;
  try {
    payload = (await req.json()) as RequestPayload;
  } catch {
    return new Response('Invalid JSON payload', { status: 400, headers: corsHeaders });
  }

  const providedSigned = Array.isArray(payload.signedUrls) ? payload.signedUrls : [];
  let signedUrls: string[] = providedSigned;

  if (signedUrls.length === 0) {
    try {
      signedUrls = await signImageUrls(payload.imagePaths ?? []);
    } catch (error) {
      console.error('Unable to sign Supabase images', error);
    }
  }
  try {
    const geminiResult = await runGemini(payload, signedUrls);
    if (!geminiResult) {
      return new Response('AI service returned an empty result', { status: 502 });
    }

    const now = new Date().toISOString();
    const primary = geminiResult.primary;
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
        alternatives: geminiResult.alternatives ?? [],
        actions: geminiResult.actions ?? [],
        images: signedUrls,
        imagePaths: payload.imagePaths ?? []
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error('Edge inference error', error);
    return new Response('AI inference failed', { status: 500, headers: corsHeaders });
  }
});
