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
   VITE_GEMINI_MODEL=gemini-2.5-flash
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
  
  -- Correctifs SQL rapides (si vous voyez "column diagnoses.user_id does not exist")
  -- Ce bloc est idempotent et peut être rejoué sans risque.
  ```sql
  alter table public.diagnoses
    add column if not exists user_id uuid references auth.users(id) on delete cascade,
    add column if not exists created_at timestamptz not null default now();

  -- Facultatif mais recommandé pour les performances
  create index if not exists idx_diagnoses_user_id on public.diagnoses(user_id);
  create index if not exists idx_diagnoses_created_at on public.diagnoses(created_at desc);
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

### Activer l’IA pour la Base de connaissances (Edge `super-function`)

Le front appelle la fonction Edge `super-function`. Le dossier `supabase/functions/super-function` fournit une implémentation qui:
- gère le CORS correctement,
- signe les images envoyées (bucket `diagnosis-images`),
- appelle Gemini (`gemini-2.5-flash`) pour générer la réponse et renvoyer des liens `links[]`.

Déploiement:

```bash
supabase login
supabase link --project-ref <voxyxpwtvfokiqqdzerl>
supabase secrets set \
  APP_URL="https://voxyxpwtvfokiqqdzerl.supabase.co" \
  APP_SERVICE_KEY="<SERVICE_ROLE_KEY>" \
  GEMINI_API_KEY="<YOUR_GEMINI_KEY>" \
  STORAGE_BUCKET_DIAGNOSIS="diagnosis-images"

supabase functions deploy super-function
```

La page “Base de connaissances” affichera alors des liens recommandés cliquables (section de droite). Si l’IA est indisponible, un fallback lisible est renvoyé.

### Correctif DB — colonne `images` manquante dans `diagnoses`

Si vous obtenez l’erreur PostgREST:

```
{"code":"PGRST204","message":"Could not find the 'images' column of 'diagnoses' in the schema cache"}
```

exécutez le script SQL suivant dans Supabase (SQL Editor), puis réessayez. Il crée la table si elle n’existe pas, ajoute la colonne `images` si besoin, (ré)active les RLS et ajoute des politiques simples par utilisateur.

```sql
-- 1) Table `diagnoses` (création si manquante)
create table if not exists public.diagnoses (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  crop text not null,
  stage text not null,
  symptoms text[] not null default '{}',
  context text,
  created_at timestamptz not null default now(),
  status text,
  confidence double precision,
  primary jsonb not null,
  alternatives jsonb,
  actions text[],
  resolved boolean not null default false
);

-- 2) Colonne `images` (ajout si manquante)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'diagnoses' and column_name = 'images'
  ) then
    alter table public.diagnoses add column images text[];
  end if;
end $$;

-- 3) Index utiles
create index if not exists diagnoses_user_id_idx on public.diagnoses (user_id);
create index if not exists diagnoses_created_at_idx on public.diagnoses (created_at desc);

-- 4) RLS (+ politiques par utilisateur)
alter table public.diagnoses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='diagnoses' and policyname='Users can select own diagnoses'
  ) then
    create policy "Users can select own diagnoses" on public.diagnoses
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='diagnoses' and policyname='Users can insert own diagnoses'
  ) then
    create policy "Users can insert own diagnoses" on public.diagnoses
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='diagnoses' and policyname='Users can update own diagnoses'
  ) then
    create policy "Users can update own diagnoses" on public.diagnoses
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='diagnoses' and policyname='Users can delete own diagnoses'
  ) then
    create policy "Users can delete own diagnoses" on public.diagnoses
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 5) Rafraîchit le cache de schéma PostgREST (utile après ALTER TABLE)
notify pgrst, 'reload schema';
```

Ensuite, relancez le diagnostic depuis l’application. L’upsert enverra bien `images: text[]` et n’échouera plus.

### Correctif DB — colonne `primary` manquante (ou mal typée)

PostgREST peut aussi renvoyer:

```
{"code":"PGRST204","message":"Could not find the 'primary' column of 'diagnoses' in the schema cache"}
```

`primary` est un mot-clé SQL. Il faut déclarer la colonne entre guillemets: `"primary"`. Exécutez ce script pour ajouter/corriger la colonne et rafraîchir le cache:

```sql
-- Ajoute la colonne "primary" au bon type si manquante
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'diagnoses' and column_name = 'primary'
  ) then
    alter table public.diagnoses add column "primary" jsonb not null default '{}'::jsonb;
  end if;
end $$;

-- Si la colonne existe mais avec un autre type, on la convertit en jsonb
do $$
declare
  col_type text;
begin
  select data_type into col_type
  from information_schema.columns
  where table_schema='public' and table_name='diagnoses' and column_name='primary';

  if col_type is not null and col_type <> 'jsonb' then
    alter table public.diagnoses
      alter column "primary" type jsonb using "primary"::jsonb;
  end if;
end $$;

-- Rafraîchit le cache de schéma PostgREST
notify pgrst, 'reload schema';
```

Après exécution, réessayez l’enregistrement d’un diagnostic.

### Correctif DB — types sûrs pour `status` et `confidence`

Si votre base a été initialisée différemment et que les types ne correspondent pas, exécutez ce correctif pour forcer:

```sql
-- status doit être du texte
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diagnoses' and column_name='status' and data_type <> 'text'
  ) then
    alter table public.diagnoses alter column status type text using status::text;
  end if;
end $$;

-- confidence doit être en double précision (numérique 0..1)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diagnoses' and column_name='confidence' and data_type <> 'double precision'
  ) then
    alter table public.diagnoses alter column confidence type double precision using nullif(confidence::text, '')::double precision;
  end if;
end $$;

-- Rafraîchit le cache
notify pgrst, 'reload schema';
```

Note: côté application, la valeur envoyée pour `confidence` est désormais normalisée en [0,1] même si le service renvoie des catégories telles que `'low' | 'medium' | 'high'`.

### Créer la table de feedback utilisateur (si retour impossible)

Si l’interface affiche « Impossible d’enregistrer le retour », créez la table et les politiques suivantes:

```sql
create table if not exists public.diagnosis_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  diagnosis_id uuid not null references public.diagnoses(id) on delete cascade,
  useful boolean not null,
  comment text,
  created_at timestamptz not null default now()
);

alter table public.diagnosis_feedback enable row level security;

-- Politiques: un utilisateur peut écrire/voir ses propres retours
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='diagnosis_feedback' and policyname='Feedback insert own'
  ) then
    create policy "Feedback insert own" on public.diagnosis_feedback
      for insert with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.diagnoses d where d.id = diagnosis_id and d.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='diagnosis_feedback' and policyname='Feedback select own'
  ) then
    create policy "Feedback select own" on public.diagnosis_feedback
      for select using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists diagnosis_feedback_user_idx on public.diagnosis_feedback(user_id);
create index if not exists diagnosis_feedback_diag_idx on public.diagnosis_feedback(diagnosis_id);

notify pgrst, 'reload schema';
```

-- Si la table existait déjà sans défaut, applique un DEFAULT auth.uid()
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diagnosis_feedback' and column_name='user_id'
  ) then
    alter table public.diagnosis_feedback alter column user_id set default auth.uid();
  end if;
end $$;

Le client n’a pas besoin d’envoyer `user_id` (défaut = auth.uid()).

### Correctif DB — contrainte sur `primary_result` (schéma hérité)

Si vous voyez l’erreur suivante lors de l’upsert:

```
{"code":"23502","message":"null value in column \"primary_result\" of relation \"diagnoses\" violates not-null constraint"}
```

cela signifie que votre schéma historique utilisait `primary_result` alors que l’application utilise la colonne citée `"primary"`. Exécutez ce script idempotent selon les cas:

```sql
-- Si `primary_result` existe et que "primary" n'existe PAS: on renomme proprement
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diagnoses' and column_name='primary_result'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diagnoses' and column_name='primary'
  ) then
    execute 'alter table public.diagnoses rename column primary_result to "primary"';
  end if;
end $$;

-- Si les deux colonnes existent: on désactive la contrainte bloquante et on synchronise une fois
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diagnoses' and column_name='primary_result'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diagnoses' and column_name='primary'
  ) then
    -- enlève NOT NULL et met un défaut neutre
    alter table public.diagnoses alter column primary_result drop not null;
    alter table public.diagnoses alter column primary_result set default '{}'::jsonb;
    -- copie la valeur depuis "primary" pour les lignes vides
    update public.diagnoses
      set primary_result = coalesce(primary_result, "primary", '{}'::jsonb)
      where primary_result is null;
  end if;
end $$;

-- Rafraîchit le cache PostgREST
notify pgrst, 'reload schema';
```

Après ce correctif, l’application écrira/ira lire dans `"primary"` et la contrainte sur `primary_result` ne bloquera plus.

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
