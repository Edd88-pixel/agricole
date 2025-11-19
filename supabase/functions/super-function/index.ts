import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type RequestPayload = { prompt: string; history?: ChatMessage[]; imagePaths?: string[]; signedUrls?: string[] };

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
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY');
const DIAGNOSIS_BUCKET = Deno.env.get('STORAGE_BUCKET_DIAGNOSIS') ?? 'diagnosis-images';

if (!APP_URL || !APP_SERVICE_KEY) throw new Error('Missing Supabase configuration');
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

const inferMimeType = (url: string) => {
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.bmp')) return 'image/bmp';
  if (lower.includes('.heic') || lower.includes('.heif')) return 'image/heic';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
};

const parseLinks = (text: string) => {
  const urlRe = /(https?:\/\/[\w.-]+(?:\/[\w\-.~:%/?#[\]@!$&'()*+,;=]*)?)/gi;
  const found = text.match(urlRe) ?? [];
  return Array.from(new Set(found)).slice(0, 6).map((u) => ({ url: u }));
};

const callGemini = async (prompt: string, history: ChatMessage[], signed: string[]) => {
  if (!GEMINI_KEY) return null;
  const model = 'gemini-2.5-flash';
  const summary = history
    .slice(-3)
    .map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const instruction =
    'Tu es un assistant agronome. Reponds en francais, de maniere concise et utile. ' +
    "Si utile et pertinent, ajoute en fin de reponse une section 'Liens utiles:' suivie de 3 a 5 URLs fiables (une par ligne).";

  const parts: any[] = [
    {
      text:
        `${instruction}\n\nContexte recent:\n${summary || 'Aucun historique'}\n\nQuestion:\n${prompt || 'Conseil general ?'}` +
        (signed.length > 0
          ? '\n\nAnalyse les images ci-dessous (photos stockees dans Supabase) puis repond en te basant sur ce que tu observes.'
          : '')
    }
  ];

  for (const fileUri of signed) {
    parts.push({
      fileData: {
        fileUri,
        mimeType: inferMimeType(fileUri)
      }
    });
  }

  if (signed.length > 0) {
    parts.push({
      text: 'Commence par decrire ce que tu vois sur les photos (symptomes, culture, niveau de gravite) avant de donner des conseils.'
    });
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts
      }
    ],
    generationConfig: {
      temperature: 0.4,
      candidateCount: 1
    }
  } as const;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    console.error('Gemini call failed', res.status, await res.text());
    return null;
  }
  const json = (await res.json()) as any;
  const txt: string | undefined = json?.candidates?.[0]?.content?.parts?.find((p: any) => p?.text)?.text;
  if (!txt) return null;
  return { message: txt };
};

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  let payload: RequestPayload;
  try {
    payload = (await req.json()) as RequestPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  const signed = payload.signedUrls ?? (await signImageUrls(payload.imagePaths ?? []));
  const prompt = (payload.prompt || '').toString();

  // Tente un appel Gemini avec vision si des images sont fournies
  try {
    const ai = await callGemini(prompt, payload.history ?? [], signed);
    if (ai && ai.message) {
      const message = ai.message as string;
      const links = parseLinks(message);
      return new Response(
        JSON.stringify({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), message, images: signed, links }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('AI call failed', error);
  }

  // Fallback simple et utile (si l'appel IA echoue)
  const message = `Voici une premiere reponse basee sur votre question${prompt ? ` : ${prompt}` : ''}.

- Decrivez la culture, le stade et les symptomes observes (emplacement, frequence).
- Ajoutez 1 a 3 photos nettes (dessus/dessous de feuilles, zones touchees).
- Precisez les pratiques recentes (arrosage, traitements, meteo).

Je pourrai affiner des que vous partagerez ces elements.`;
  return new Response(
    JSON.stringify({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), message, images: signed, links: [] }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
});
