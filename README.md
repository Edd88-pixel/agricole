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
   VITE_SUPABASE_STORAGE_BUCKET_PROFILE=profile-avatars
   VITE_SUPABASE_FUNCTION_DIAGNOSIS=diagnosis-infer
   VITE_SUPABASE_FUNCTION_KNOWLEDGE=knowledge-chat
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
   -- Profils utilisateur : compléter la table existante avec les nouveaux champs
   alter table public.users_profiles
     add column if not exists first_name text,
     add column if not exists last_name text,
     add column if not exists avatar_path text;

   alter table public.users_profiles
     add column if not exists display_name text;

   update public.users_profiles
     set display_name = coalesce(display_name, '')
   where display_name is null;

   alter table public.users_profiles
     alter column display_name set not null;

   alter table public.users_profiles
     add column if not exists locale text not null default 'fr',
     add column if not exists objectives text,
     add column if not exists location text,
     add column if not exists crops text[] not null default '{}'::text[],
     add column if not exists onboarding_completed boolean not null default false,
     add column if not exists created_at timestamptz not null default now();

   alter table public.users_profiles enable row level security;
   do $$
   begin
     if not exists (
       select 1 from pg_policies where schemaname = 'public' and tablename = 'users_profiles' and policyname = 'Users read their profile'
     ) then
       create policy "Users read their profile" on public.users_profiles for select using (auth.uid() = id);
     end if;
     if not exists (
       select 1 from pg_policies where schemaname = 'public' and tablename = 'users_profiles' and policyname = 'Users update their profile'
     ) then
       create policy "Users update their profile" on public.users_profiles for update using (auth.uid() = id);
     end if;
     if not exists (
       select 1 from pg_policies where schemaname = 'public' and tablename = 'users_profiles' and policyname = 'Users insert their profile'
     ) then
       create policy "Users insert their profile" on public.users_profiles for insert with check (auth.uid() = id);
     end if;
   end;
   $$;

  -- Diagnostics : mise à jour de la table pour stocker les résultats Gemini et les images
  alter table public.diagnoses
    add column if not exists confidence numeric default 0.5;

  update public.diagnoses
    set confidence = coalesce(confidence, 0.5)
  where confidence is null;

  alter table public.diagnoses
    alter column confidence set not null;

  alter table public.diagnoses
    add column if not exists primary jsonb,
    add column if not exists alternatives jsonb default '[]'::jsonb,
    add column if not exists actions text[] default '{}'::text[],
    add column if not exists images text[] default '{}'::text[],
    add column if not exists resolved boolean default false;

  alter table public.diagnoses enable row level security;
  do $$
  begin
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'diagnoses' and policyname = 'Owners read their diagnoses'
    ) then
      create policy "Owners read their diagnoses" on public.diagnoses for select using (auth.uid() = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'diagnoses' and policyname = 'Owners insert diagnoses'
    ) then
      create policy "Owners insert diagnoses" on public.diagnoses for insert with check (auth.uid() = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'diagnoses' and policyname = 'Owners update diagnoses'
    ) then
      create policy "Owners update diagnoses" on public.diagnoses for update using (auth.uid() = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'diagnoses' and policyname = 'Owners delete diagnoses'
    ) then
      create policy "Owners delete diagnoses" on public.diagnoses for delete using (auth.uid() = user_id);
    end if;
  end;
  $$;

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
   do $$
   begin
     if not exists (
       select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_articles' and policyname = 'Knowledge base readable'
     ) then
       create policy "Knowledge base readable" on public.kb_articles for select using (true);
     end if;
     if not exists (
       select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_articles' and policyname = 'Service role manages KB'
     ) then
       create policy "Service role manages KB" on public.kb_articles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
     end if;
   end;
   $$;

  -- Feedback utilisateur sur les diagnostics (à créer si absent)
  create table if not exists public.diagnosis_feedback (
    id uuid primary key default gen_random_uuid(),
    diagnosis_id uuid not null references public.diagnoses(id) on delete cascade,
    useful boolean not null,
    comment text,
    created_at timestamptz not null default now(),
    user_id uuid not null references auth.users on delete cascade
  );

  alter table public.diagnosis_feedback enable row level security;
  do $$
  begin
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'diagnosis_feedback' and policyname = 'Owners manage their feedback'
    ) then
      create policy "Owners manage their feedback" on public.diagnosis_feedback
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;
  end;
  $$;
  ```
3. **Buckets de stockage privés**
   ```bash
  supabase storage create-bucket diagnosis-images --public=false
  supabase storage create-bucket diagnosis-reports --public=false
  supabase storage create-bucket profile-avatars --public=false
   ```
   Politiques de storage (SQL) :
   ```sql
  create policy "Users read own diagnosis images" on storage.objects for select
    using (bucket_id = 'diagnosis-images' and auth.uid() = owner);

  create policy "Users upload diagnosis images" on storage.objects for insert
    with check (bucket_id = 'diagnosis-images' and auth.uid() = owner);

  create policy "Users delete diagnosis images" on storage.objects for delete
    using (bucket_id = 'diagnosis-images' and auth.uid() = owner);

  create policy "Users read own avatars" on storage.objects for select
    using (bucket_id = 'profile-avatars' and auth.uid() = owner);

  create policy "Users manage own avatars" on storage.objects for insert
    with check (bucket_id = 'profile-avatars' and auth.uid() = owner);

  create policy "Users remove own avatars" on storage.objects for delete
    using (bucket_id = 'profile-avatars' and auth.uid() = owner);
  ```
4. **Secrets et Edge Functions Gemini**
   - Déployer les fonctions fournies dans `supabase/functions/diagnosis-infer/index.ts` et `supabase/functions/knowledge-chat/index.ts` :
     ```bash
     supabase functions deploy diagnosis-infer --project-ref voxyxpwtvfokiqqdzerl
     supabase functions deploy knowledge-chat --project-ref voxyxpwtvfokiqqdzerl
     ```
   - Enregistrer les secrets (Gemini + accès Supabase service-role) :
     ```bash
     supabase secrets set \
       GEMINI_API_KEY=AIzaSyAjo6xlBHdw9U_znTY_r244gb5ttqGNRaE \
       APP_URL=https://voxyxpwtvfokiqqdzerl.supabase.co \
       APP_SERVICE_KEY=<VOTRE_SERVICE_ROLE_KEY> \
       STORAGE_BUCKET_DIAGNOSIS=diagnosis-images \
       STORAGE_BUCKET_PROFILE=profile-avatars \
       --project-ref voxyxpwtvfokiqqdzerl
     ```
   - Vérifier le journal de la fonction :
     ```bash
     supabase functions logs diagnosis-infer --project-ref voxyxpwtvfokiqqdzerl
     supabase functions logs knowledge-chat --project-ref voxyxpwtvfokiqqdzerl
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

## 7. Checklist de validation
- [ ] Créer un compte utilisateur et se connecter (auth Supabase active).
- [ ] Lancer un scan rapide ou guidé avec au moins une photo : le résultat s’affiche avec les images et des actions générées par l’IA à partir des clichés et informations saisis.
- [ ] Vérifier dans l’historique que le diagnostic apparaît avec les mêmes médias (les URL sont régénérées automatiquement).
- [ ] Modifier un diagnostic (stade ou contexte) depuis l’historique et confirmer que la mise à jour persiste après rechargement.
- [ ] Supprimer un diagnostic et vérifier qu’il disparaît de l’interface **et** des buckets (`diagnosis-images`).
- [ ] Générer un rapport PDF depuis le résultat ou l’historique et contrôler sa mise en forme.
- [ ] Mettre à jour son profil (prénom, nom, avatar) et vérifier que les informations sont reflétées dans le header et la page Paramètres.
- [ ] Tester l’avis « Utile / À améliorer » sur un diagnostic et contrôler que la réponse est persistée (table `diagnosis_feedback`).
- [ ] Converser avec la base de connaissances en joignant éventuellement des photos et vérifier que la réponse de l’assistant est bien formatée et contextualisée.
- [ ] Parcourir la médiathèque pour filtrer les photos par culture ou diagnostic et relire les actions recommandées pour chaque analyse.
- [ ] Exécuter `npm test` et s’assurer que tous les tests passent.
