# Agricole – Installation et exécution

Application full-stack composée d'un frontend React/TypeScript (Vite + Tailwind) et d'un backend Node/Express minimal. Ce guide permet à un développeur externe de cloner, installer, tester et lancer l'application sans autre aide.

## Prérequis
- Node.js 20+
- npm 10+
- Supabase CLI ≥ 1.190 (si vous gérez l'infrastructure Supabase)

## Structure du dépôt
```
frontend/   Application React (Vite + Tailwind + Supabase)
backend/    API Express minimaliste
```

## Variables d'environnement
Des fichiers d'exemple sont fournis :
- `frontend/.env.example`
- `backend/.env.example`

Copiez-les puis complétez les valeurs réelles :
```bash
cd frontend
cp .env.example .env
# renseignez les clés Supabase/API

cd ../backend
cp .env.example .env
```

Variables principales :
- **Frontend** : `VITE_API_BASE_URL` (URL de l'API, ex. `http://localhost:4000`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, noms des buckets (`VITE_SUPABASE_STORAGE_BUCKET_*`), noms d'Edge Functions (`VITE_SUPABASE_FUNCTION_*`), `SUPABASE_GEMINI_API_KEY` pour l'appel serveur → Edge.
- **Backend** : `PORT` (par défaut `4000`), `NODE_ENV`.

## Installation des dépendances
```bash
# depuis la racine du dépôt
cd frontend && npm install
cd ../backend && npm install
```

## Lancer en développement
Ouvrez deux terminaux :
1. **Backend** (port 4000 par défaut)
   ```bash
   cd backend
   npm run dev
   ```
2. **Frontend** (port Vite : 5173)
   ```bash
   cd frontend
   npm run dev
   ```

## Exécution des tests
- **Backend**
  ```bash
  cd backend
  npm test          # suite complète
  npm run test:unit
  npm run test:integration
  ```
- **Frontend**
  ```bash
  cd frontend
  npm test          # tests + couverture
  npm run test:watch
  ```

## Builds de production
- **Frontend** :
  ```bash
  cd frontend
  npm run build           # génère dist/
  npm run preview -- --host --port 4173  # sert la build localement
  ```
- **Backend** : pas de build spécifique ; lancer simplement le serveur Node en mode production :
  ```bash
  cd backend
  NODE_ENV=production npm start
  ```

## Deploiement Docker
- Prerequis : Docker + Docker Compose. Preparer `backend/.env` (copie de `backend/.env.example` avec vos cles). Les variables VITE_* du frontend sont passees au build via Docker Compose ou via export avant la commande.
- Lancer la stack :
  ```bash
  docker compose up --build
  ```
  Frontend : `http://localhost:8080`, API : `http://localhost:4000` (`/api/health` pour tester).
- Personnaliser les variables compilees du frontend (API, Supabase...) :
  ```bash
  VITE_API_BASE_URL=http://localhost:4000 \
  VITE_SUPABASE_URL=https://<project>.supabase.co \
  VITE_SUPABASE_ANON_KEY=<anon-key> \
  VITE_GEMINI_MODEL=gemini-2.5-flash \
  docker compose up --build
  # ou: docker compose --env-file .env.docker up --build
  ```
- Commandes utiles : `docker compose up -d`, `docker compose logs -f backend`, `docker compose down`.
- Le frontend nginx expose aussi un proxy `/api` vers le service backend sur le reseau Docker. Gardez `VITE_API_BASE_URL` pointe vers un hote accessible par le navigateur (ex. `http://localhost:4000` ou `http://localhost:8080` si vous utilisez le proxy). Le backend a CORS permissif si vous restez en cross-origin.

## Vérification manuelle (prod-like)
1. Démarrer le backend sur le port 4000 : `NODE_ENV=production npm start`.
2. Démarrer le frontend en mode preview : `npm run preview -- --host --port 4173` (dans `frontend/`).
3. Ouvrir `http://localhost:4173` et vérifier que le healthcheck côté API répond `GET http://localhost:4000/api/health -> {"status":"ok"}`.

## Provisionnement Supabase (optionnel mais recommandé)
- Lier votre projet :
  ```bash
  cd backend
  supabase login
  supabase link --project-ref <project-ref>
  ```
- Migrations SQL : placez vos scripts dans `backend/supabase/migrations` puis appliquez-les avec `supabase db push`.
- Edge Functions : déployez-les avec `supabase functions deploy <function-name>`.
- Buckets de stockage : créez ceux référencés par les variables `VITE_SUPABASE_STORAGE_BUCKET_*` (ex. `diagnosis-images`, `diagnosis-reports`, `profile-avatars`).

## Configuration Supabase pour le chat realtime

Cette section décrit tout ce qui doit être configuré dans l'interface Supabase pour que le streaming du chat fonctionne (tables, Realtime, RLS, triggers) ainsi que les variables d'environnement côté app. Elle suppose que la table `kb_articles` existe déjà (schéma fourni en bas de section).

### 1. Création des tables (SQL prêt à exécuter)
Ouvrez **SQL editor → New query** dans Supabase et copiez-collez le bloc suivant (adaptez les noms de schéma si besoin — par défaut `public`). Les contraintes correspondent au backend actuel (`conversationId`/`messageId` générés côté API) :

```sql
-- Conversations utilisateur
create table if not exists public.kb_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Messages consolidés (assistant ou utilisateur)
create table if not exists public.kb_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kb_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text,
  links jsonb,
  status text not null default 'pending' check (status in ('pending', 'streaming', 'done', 'error')),
  created_at timestamptz not null default timezone('utc', now())
);

-- Événements de streaming (support Realtime)
create table if not exists public.kb_events (
  id bigserial primary key,
  conversation_id uuid not null references public.kb_conversations(id) on delete cascade,
  message_id uuid not null,
  event text not null check (event in ('start', 'chunk', 'end', 'error')),
  content text,
  progress integer,
  links jsonb,
  error text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Index utiles pour Realtime/filtrage
create index if not exists idx_kb_events_conversation_event on public.kb_events (conversation_id, event);
create index if not exists idx_kb_messages_conversation on public.kb_messages (conversation_id);
```

> La table `kb_articles` existante doit rester inchangée (colonnes `id uuid`, `crop text`, `symptom text`, `title text`, `summary text`, `content text`, `locale text`, `created_at timestamptz`).

### 2. Activer Realtime sur les tables concernées
Pour permettre au frontend de recevoir les événements instantanément :
1. Dans l'interface Supabase, ouvrez **Table editor**.
2. Sélectionnez `kb_events` puis ouvrez l'onglet **Realtime** (icône éclair).
3. Activez **Enable Realtime** et cochez au minimum **INSERT** (UPDATE/DELETE inutiles pour ce flux).
4. (Optionnel) Activez Realtime pour `kb_messages` si vous souhaitez être notifié des changements post-traitement.

> Assurez-vous que le paramètre projet **Database → Replication → Realtime** est activé au niveau du schéma `public` (cochez `public` dans la publication `supabase_realtime` si ce n'est pas déjà fait).

### 3. Policies RLS (copier-coller)
Activez RLS sur chaque table puis exécutez les policies suivantes dans le SQL editor.

```sql
-- Activer RLS
alter table public.kb_conversations enable row level security;
alter table public.kb_messages enable row level security;
alter table public.kb_events enable row level security;

-- Conversations : chaque utilisateur ne voit que ses conversations
drop policy if exists "kb_conversations_select" on public.kb_conversations;
create policy "kb_conversations_select" on public.kb_conversations
  for select using (user_id = auth.uid());

drop policy if exists "kb_conversations_insert" on public.kb_conversations;
create policy "kb_conversations_insert" on public.kb_conversations
  for insert with check (user_id = auth.uid());

drop policy if exists "kb_conversations_update" on public.kb_conversations;
create policy "kb_conversations_update" on public.kb_conversations
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "kb_conversations_delete" on public.kb_conversations;
create policy "kb_conversations_delete" on public.kb_conversations
  for delete using (user_id = auth.uid());

-- Messages : accès limité aux conversations appartenant à l'utilisateur
drop policy if exists "kb_messages_select" on public.kb_messages;
create policy "kb_messages_select" on public.kb_messages
  for select using (exists (
    select 1 from public.kb_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  ));

drop policy if exists "kb_messages_insert" on public.kb_messages;
create policy "kb_messages_insert" on public.kb_messages
  for insert with check (exists (
    select 1 from public.kb_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  ));

drop policy if exists "kb_messages_update" on public.kb_messages;
create policy "kb_messages_update" on public.kb_messages
  for update using (exists (
    select 1 from public.kb_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.kb_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  ));

drop policy if exists "kb_messages_delete" on public.kb_messages;
create policy "kb_messages_delete" on public.kb_messages
  for delete using (exists (
    select 1 from public.kb_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  ));

-- Événements : lecture côté client limitée à ses conversations, écriture réservée au service role (backend)
drop policy if exists "kb_events_select" on public.kb_events;
create policy "kb_events_select" on public.kb_events
  for select using (exists (
    select 1 from public.kb_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  ));

drop policy if exists "kb_events_insert_service" on public.kb_events;
create policy "kb_events_insert_service" on public.kb_events
  for insert with check (auth.role() = 'service_role');

-- (Optionnel) empêcher toute mise à jour/suppression côté client ; seule l'API service peut maintenir ces lignes
drop policy if exists "kb_events_update_service" on public.kb_events;
create policy "kb_events_update_service" on public.kb_events
  for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "kb_events_delete_service" on public.kb_events;
create policy "kb_events_delete_service" on public.kb_events
  for delete using (auth.role() = 'service_role');
```

### 4. Trigger d'agrégation des événements vers les messages (optionnel mais prêt à l'emploi)
Ce trigger consolide automatiquement les événements `kb_events` dans `kb_messages` (utile pour relire l'historique sans recharger tous les chunks). Exécutez-le dans le SQL editor si vous souhaitez cette persistance.

```sql
create or replace function public.kb_apply_event_to_message()
returns trigger as $$
begin
  -- Créer le message assistant dès le premier événement
  if new.event = 'start' then
    insert into public.kb_messages (id, conversation_id, role, status, content, links, created_at)
    values (new.message_id, new.conversation_id, 'assistant', 'streaming', coalesce(new.content, ''), coalesce(new.links, '[]'::jsonb), new.created_at)
    on conflict (id) do update set status = 'streaming';

  elsif new.event = 'chunk' then
    update public.kb_messages
      set content = coalesce(content, '') || coalesce(new.content, ''), status = 'streaming'
      where id = new.message_id;

  elsif new.event = 'end' then
    update public.kb_messages
      set content = coalesce(content, '') || coalesce(new.content, ''),
          links = coalesce(new.links, links),
          status = 'done'
      where id = new.message_id;

  elsif new.event = 'error' then
    update public.kb_messages
      set content = coalesce(content, '') || coalesce(new.content, ''),
          links = coalesce(new.links, links),
          status = 'error'
      where id = new.message_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_kb_events_apply on public.kb_events;
create trigger trg_kb_events_apply
after insert on public.kb_events
for each row execute function public.kb_apply_event_to_message();
```

> Si vous préférez gérer la consolidation côté backend, ne créez pas ce trigger.

### 5. Variables d'environnement à renseigner

#### Backend (`backend/.env`)
- `SUPABASE_URL` : URL du projet (ex. `https://<project>.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` : clé service (utilisée pour publier dans `kb_events`).
- `SUPABASE_ANON_KEY` : clé publique (utile pour certaines vérifications). 
- `SUPABASE_FUNCTION_KNOWLEDGE` : nom ou URL complète de la fonction Edge `knowledge-chat` utilisée pour le streaming.
- `SUPABASE_STORAGE_BUCKET_KNOWLEDGE` : bucket optionnel pour les pièces jointes du chat (sinon fallback `diagnosis-images`).

#### Frontend (`frontend/.env`)
- `VITE_SUPABASE_URL` : même URL de projet.
- `VITE_SUPABASE_ANON_KEY` : clé publique (Requête Realtime côté navigateur).
- `VITE_SUPABASE_FUNCTION_KNOWLEDGE` : nom de la fonction Edge pour les appels HTTP.
- `VITE_SUPABASE_STORAGE_BUCKET_KNOWLEDGE` (si utilisé) : bucket pour les uploads liés au chat.

> Le frontend n'a jamais accès à la clé service ; seule la clé `anon` est utilisée pour se connecter à Realtime.

### 6. Chemins UI précis pour la configuration
- **Créer les tables** : `SQL editor → New query → coller le SQL ci-dessus → Run`.
- **Activer RLS** : `Table editor → <table> → Security → Enable RLS` (répéter pour `kb_conversations`, `kb_messages`, `kb_events`).
- **Ajouter les policies** : `SQL editor → New query → coller le bloc policies → Run`.
- **Créer le trigger** : `SQL editor → New query → coller le bloc trigger → Run` (optionnel).
- **Activer Realtime** : `Table editor → kb_events → Realtime → Enable Realtime → cocher INSERT` (et `kb_messages` si souhaité).
- **Vérifier la publication Realtime** : `Database → Replication → Publications → supabase_realtime → cocher schéma public` si non actif.

Après ces étapes, le backend peut publier des événements (`service_role`) et le frontend peut s'abonner en filtrant par `conversation_id`/`message_id`.

## Tests API via Postman
- **URL de base** : `http://localhost:4000` (variable recommandée : `apiBaseUrl`).
- **Headers** : `Accept: application/json` ; aucune authentification requise pour le healthcheck.
- **Endpoint disponible** :

  | Méthode | Chemin                      | Corps | Réponse attendue |
  |---------|----------------------------|-------|------------------|
  | GET     | `{{apiBaseUrl}}/api/health` | N/A   | `200 OK`, `{ "status": "ok" }` |

> Ajoutez d'autres requêtes dans votre collection en suivant le préfixe `/api` et en utilisant `VITE_API_BASE_URL` côté frontend / `apiBaseUrl` côté Postman.

## Dépannage
- Vérifiez que les fichiers `.env` sont complets et chargés par Vite/Node.
- Si Vite preview signale un port occupé, spécifiez un autre port via `--port`.
- Le backend expose CORS permissif (`Access-Control-Allow-Origin: *`) pour simplifier les appels depuis le frontend.

## Export PDF (diagnostic)
- Format : A4 portrait, marges fixes de 20 mm définies dans `frontend/src/features/diagnosis/services/report.ts` (constante `BASE_MARGIN`).
- Génération : pdf-lib dans `report.ts` ; le texte est automatiquement wrappé selon la largeur disponible (wrap, gestion des retours à la ligne, colonnes).
- Ajuster la largeur : modifiez `BASE_MARGIN` et/ou les largeurs de colonne dans `report.ts`. Le contenu se recalcule pour rester dans la zone imprimable.
