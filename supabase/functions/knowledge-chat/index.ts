import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type RequestPayload = {
  prompt: string;
  history?: ChatHistoryItem[];
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
  if (!paths || paths.length === 0) return [] as string[];
  const { data, error } = await supabase.storage.from(DIAGNOSIS_BUCKET).createSignedUrls(paths, 60 * 10);
  if (error) {
    console.error('Unable to sign image URLs', error);
    return [];
  }
  return (data ?? []).map((item) => item.signedUrl);
};

const buildPrompt = (payload: RequestPayload, signedUrls: string[]) => {
  const historyParts = (payload.history ?? []).map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.content }]
  }));

  const imageText = signedUrls.length > 0 ? `\nImages: ${signedUrls.join(', ')}` : '';

  return {
    contents: [
      ...historyParts,
      {
        role: 'user',
        parts: [
          {
            text:
              `Contexte utilisateur: ${payload.prompt}${imageText}\n` +
              'Réponds comme un agronome expert. Fournis un résumé en 3 phrases maximum, ' +
              'suivi d’une liste d’actions concrètes et priorisées. Termine par une recommandation de surveillance. ' +
              'Ne propose jamais de générer des images ni de contenus hors sujet. '
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      responseMimeType: 'text/plain'
    }
  };
};

const runKnowledge = async (payload: RequestPayload, signedUrls: string[]) => {
  const model = payload.model ?? 'gemini-2.5-flash';
  const body = buildPrompt(payload, signedUrls);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    throw new Error(`Inference error ${response.status}`);
  }

  const json = (await response.json()) as GeminiResponse;
  const candidateText = json.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!candidateText) {
    throw new Error('Empty AI response');
  }

  return candidateText.trim();
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

  try {
    const signedUrls = await signImageUrls(payload.imagePaths ?? []);
    const message = await runKnowledge(payload, signedUrls);
    return new Response(
      JSON.stringify({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        message,
        images: signedUrls
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Knowledge chat error', error);
    return new Response('AI assistant failed to respond', { status: 500 });
  }
});
