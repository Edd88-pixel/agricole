import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type RequestPayload = { prompt: string; history?: ChatMessage[]; imagePaths?: string[] };

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

const APP_URL = Deno.env.get('APP_URL');
const APP_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY');
const DIAGNOSIS_BUCKET = Deno.env.get('STORAGE_BUCKET_DIAGNOSIS') ?? 'diagnosis-images';

if (!APP_URL || !APP_SERVICE_KEY) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(APP_URL, APP_SERVICE_KEY, { auth: { persistSession: false } });

const signImageUrls = async (paths: string[]) => {
  if (paths.length === 0) return [] as string[];
  const { data, error } = await supabase.storage.from(DIAGNOSIS_BUCKET).createSignedUrls(paths, 60 * 10);
  if (error) {
    console.error('Unable to sign image URLs', error);
    return [];
  }
  return (data ?? []).map((item) => item.signedUrl);
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

  const prompt = (payload.prompt ?? '').toString();
  const history = payload.history ?? [];
  const signed = await signImageUrls(payload.imagePaths ?? []);

  // Minimal, robust assistant reply (fallback). Replace with LLM call if desired.
  const summary = history
    .slice(-3)
    .map((m) => `${m.role === 'user' ? 'Vous' : 'Assistant'}: ${m.content}`)
    .join('\n');
  const hints = [
    '• Vérifiez l’arrosage et le drainage des dernières 48h.',
    '• Inspectez plusieurs feuilles pour confirmer le symptôme.',
    '• Comparez avec des cas similaires dans la base de connaissances.'
  ].join('\n');

  const message = [
    summary ? `Contexte récent:\n${summary}` : '',
    prompt ? `Question:\n${prompt}` : '',
    signed.length > 0 ? `Images reçues: ${signed.length}` : '',
    'Pistes de vérification:\n' + hints
  ]
    .filter(Boolean)
    .join('\n\n');

  return new Response(
    JSON.stringify({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      message,
      images: signed
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
});
