import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type RequestPayload = { prompt: string; history?: ChatMessage[]; imagePaths?: string[]; signedUrls?: string[] };

const buildCors = (req: Request): HeadersInit => {
  const origin = req.headers.get('origin') ?? '*';
  const requested = req.headers.get('access-control-request-headers') ?? 'authorization, x-client-info, apikey, content-type';
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
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY');
const DIAGNOSIS_BUCKET = Deno.env.get('STORAGE_BUCKET_DIAGNOSIS') ?? 'diagnosis-images';

if (!APP_URL || !APP_SERVICE_KEY) throw new Error('Missing Supabase configuration');
const supabase = createClient(APP_URL, APP_SERVICE_KEY, { auth: { persistSession: false } });

const signImageUrls = async (paths: string[]) => {
  if (paths.length === 0) return [] as string[];
  const { data, error } = await supabase.storage.from(DIAGNOSIS_BUCKET).createSignedUrls(paths, 60 * 10);
  if (error) return [];
  return (data ?? []).map((item) => item.signedUrl);
};

const callGemini = async (prompt: string, history: ChatMessage[], signed: string[]) => {
  if (!GEMINI_KEY) return null;
  const model = 'gemini-2.5-flash';
  const summary = history
    .slice(-3)
    .map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const instruction =
    'Tu es un assistant agronome. Réponds en français, de manière concise et utile. '
    + "Si utile et pertinent selon la question, ajoute en fin de réponse une section 'Liens utiles:' suivie de 3 à 5 URLs fiables (une par ligne).";

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              `${instruction}\n\nContexte récent:\n${summary}\n\nQuestion:\n${prompt}` +
              (signed.length > 0 ? `\n\nImages pertinentes (URLs signées):\n${signed.join('\n')}` : '')
          }
        ]
      }
    ]
  } as any;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const txt: string | undefined = json?.candidates?.[0]?.content?.parts?.find((p: any) => p?.text)?.text;
  if (!txt) return null;
  return { message: txt } as { message: string };
};

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  let payload: RequestPayload;
  try { payload = (await req.json()) as RequestPayload; } catch { return new Response('Invalid JSON', { status: 400, headers: corsHeaders }); }

  const signed = payload.signedUrls ?? (await signImageUrls(payload.imagePaths ?? []));
  const prompt = (payload.prompt || '').toString();

  // Essayez d’appeler Gemini; sinon, retour simple
  try {
    const ai = await callGemini(prompt, payload.history ?? [], signed);
    if (ai && ai.message) {
      const message = ai.message as string;
      // simple extraction des URLs depuis le texte
      const urlRe = /(https?:\/\/[\w.-]+(?:\/[\w\-.~:%/?#[\]@!$&'()*+,;=]*)?)/gi;
      const found = message.match(urlRe) ?? [];
      const links = Array.from(new Set(found)).slice(0, 6).map((u) => ({ url: u }));
      return new Response(
        JSON.stringify({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), message, images: signed, links }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (_e) {
    // ignore, fallback below
  }

  // Fallback simple et utile (si l'appel IA échoue):
  const message = `Voici une première réponse basée sur votre question${prompt ? ` « ${prompt} »` : ''}.

- Décrivez précisément la culture, le stade et les symptômes repérés (emplacement, fréquence).
- Ajoutez 1 à 3 photos nettes (dessus/dessous de feuilles, zones touchées).
- Précisez les pratiques récentes (arrosage, traitements, météo).

Je pourrai affiner dès que vous partagerez ces éléments.`;
  return new Response(
    JSON.stringify({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), message, images: signed, links: [] }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
});
