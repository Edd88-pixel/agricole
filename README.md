# Agricole – Diagnostic agricole intelligent

Application web React + TypeScript + Tailwind qui pilote un diagnostic agricole bilingue (FR/EN) avec thèmes clair/sombre et un backend 100 % Supabase (authentification, base de données, storage, Edge Functions Gemini).

## 1. Pré-requis
- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) ≥ 1.190
- Accès au projet Supabase `voxyxpwtvfokiqqdzerl`

## 2. Mise en place locale
1. **Installer les dépendances**
   ```bash
   npm install
   ```
2. **Configurer les variables d’environnement**
   ```bash
   cp .env.example .env
   ```
   Puis renseignez :
   ```ini
   VITE_SUPABASE_URL=https://voxyxpwtvfokiqqdzerl.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveHl4cHd0dmZva2lxcWR6ZXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc1MDIsImV4cCI6MjA3ODE5MzUwMn0.LMgQIlPHUXDdV9LBefMbUrTVEfmZ7tvIBNgysi3cN0A
   VITE_GEMINI_MODEL=gemini-1.5-pro-latest
   VITE_SUPABASE_STORAGE_BUCKET_DIAGNOSIS=diagnosis-images
   VITE_SUPABASE_STORAGE_BUCKET_REPORTS=diagnosis-reports
   VITE_SUPABASE_FUNCTION_DIAGNOSIS=diagnosis-infer
   SUPABASE_GEMINI_API_KEY=AIzaSyAjo6xlBHdw9U_znTY_r244gb5ttqGNRaE
   ```
3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
4. **Tests et build**
   ```bash
   npm test          # tests unitaires + couverture
   npm run build     # build de production (Vite)
   ```

## 3. Provisionnement Supabase (CLI)
1. **Connexion et liaison du projet**
   ```bash
   supabase login
   supabase link --project-ref voxyxpwtvfokiqqdzerl
   ```
2. **Schéma de base de données** (SQL à exécuter depuis le SQL Editor ou `supabase db remote commit`)
   ```sql
   -- Profils utilisateur
   create table if not exists public.users_profiles (
     id uuid primary key references auth.users on delete cascade,
     email text,
     display_name text not null,
     locale text not null default 'fr',
     objectives text,
     location text,
     crops text[] not null default '{}',
     onboarding_completed boolean not null default false,
     created_at timestamptz not null default now()
   );

   alter table public.users_profiles enable row level security;
   create policy "Users read their profile" on public.users_profiles for select using (auth.uid() = id);
   create policy "Users update their profile" on public.users_profiles for update using (auth.uid() = id);
   create policy "Users insert their profile" on public.users_profiles for insert with check (auth.uid() = id);

   -- Diagnostics
   create table if not exists public.diagnoses (
     id uuid primary key,
     owner uuid references auth.users on delete cascade,
     crop text not null,
     stage text not null,
     symptoms text[] not null,
     context text,
     created_at timestamptz not null default now(),
     status text not null,
     confidence numeric not null,
     primary jsonb not null,
     alternatives jsonb default '[]',
     actions text[] default '{}',
     resolved boolean default false
   );

   alter table public.diagnoses enable row level security;
   create policy "Owners read their diagnoses" on public.diagnoses for select using (auth.uid() = owner);
   create policy "Owners upsert diagnoses" on public.diagnoses for insert with check (auth.uid() = owner);
   create policy "Owners update resolved" on public.diagnoses for update using (auth.uid() = owner);

   -- Base de connaissances (lecture publique, écriture via rôle service)
   create table if not exists public.kb_articles (
     id uuid primary key default gen_random_uuid(),
     crop text not null,
     symptom text not null,
     title text not null,
     summary text not null,
     content text not null,
     locale text not null default 'fr',
     created_at timestamptz not null default now()
   );

   alter table public.kb_articles enable row level security;
   create policy "Knowledge base readable" on public.kb_articles for select using (true);
   create policy "Service role manages KB" on public.kb_articles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
   ```
3. **Buckets de stockage privés**
   ```bash
   supabase storage create-bucket diagnosis-images --public=false
   supabase storage create-bucket diagnosis-reports --public=false
   ```
   Politiques de storage (SQL) :
   ```sql
   create policy "Users read own diagnosis images" on storage.objects for select
     using (bucket_id = 'diagnosis-images' and auth.uid() = owner);

   create policy "Users upload diagnosis images" on storage.objects for insert
     with check (bucket_id = 'diagnosis-images' and auth.uid() = owner);
   ```
4. **Secrets et Edge Function Gemini**
   - Déployer la fonction fournie dans `supabase/functions/diagnosis-infer/index.ts` :
     ```bash
     supabase functions deploy diagnosis-infer --project-ref voxyxpwtvfokiqqdzerl
     ```
   - Enregistrer les secrets (Gemini + accès Supabase service-role) :
     ```bash
     supabase secrets set \
       GEMINI_API_KEY=AIzaSyAjo6xlBHdw9U_znTY_r244gb5ttqGNRaE \
       APP_URL=https://voxyxpwtvfokiqqdzerl.supabase.co \
       APP_SERVICE_KEY=<VOTRE_SERVICE_ROLE_KEY> \
       STORAGE_BUCKET_DIAGNOSIS=diagnosis-images \
       --project-ref voxyxpwtvfokiqqdzerl
     ```
   - Vérifier le journal de la fonction :
     ```bash
     supabase functions logs diagnosis-infer --project-ref voxyxpwtvfokiqqdzerl
     ```

## 4. Scripts npm principaux
| Commande            | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Démarrage Vite + rechargement à chaud              |
| `npm run build`     | Build de production optimisé                       |
| `npm run preview`   | Prévisualisation du build                          |
| `npm test`          | Tests Vitest + couverture V8                       |

## 5. Qualité & production
- Couverture unitaire sur les hooks/services critiques (`npm test`).
- Audit sécurité des dépendances (`npm audit`) – résolu via override esbuild ≥ 0.25.
- Build Vite + artefacts prêts pour hébergement CDN.
- Front-end consomme exclusivement Supabase (auth, RLS, storage, functions).

## 6. Support
- Ajuster l’i18n (fichiers `src/app/i18n/messages/*`).
- Ajouter de nouveaux contenus dans la base via `kb_articles` ou l’interface Admin.
- Pour toute modification du backend, regénérer la fonction edge et redéployer via `supabase functions deploy`.
