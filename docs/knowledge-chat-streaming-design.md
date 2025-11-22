# Chat connaissance : audit et design du streaming

## 1. Architecture actuelle et flux de requête
- **Frontend** : la page `KnowledgeBase` gère localement l'historique de messages, envoie la requête et affiche la réponse une fois reçue. L'état `isSending` sert uniquement à montrer un indicateur d'attente; aucun streaming n'est consommé aujourd'hui.【F:frontend/src/features/kb/components/KnowledgeBase.tsx†L19-L123】
- **Appel réseau** : le service `sendKnowledgeMessage` encapsule un POST multipart vers `api/functions/knowledge` avec le prompt, l'historique et des fichiers éventuels. Le timeout est volontairement très long, ce qui traduit un appel bloquant jusqu'à la réponse complète.【F:frontend/src/features/kb/services/chat.ts†L22-L28】【F:frontend/src/services/api/functions.ts†L36-L46】
- **Backend** : l'endpoint Express `/api/functions/knowledge` applique l'authentification, gère l'upload des pièces jointes vers Supabase Storage (bucket `knowledge` ou fallback), puis invoque de façon synchrone la fonction Edge `knowledgeChat`. La réponse finale du POST reprend le payload complet de l'Edge Function ou un fallback local en cas d'échec.【F:backend/src/routes/functionRoutes.js†L1-L13】【F:backend/src/controllers/functionsController.js†L146-L195】
- **Supabase** : aucune utilisation de Realtime pour le chat; Supabase sert uniquement de stockage (uploads et URLs signées) et de proxy d'exécution via `invokeEdgeFunction`. Les seules tables actuellement consultées côté backend sont `kb_articles`, `diagnoses`, `users_profiles` et `diagnosis_feedback`; aucune table dédiée aux conversations n'existe.【F:backend/src/services/supabaseService.js†L54-L152】

**Chemin actuel d'une question utilisateur**
1. L'utilisateur saisit un prompt et clique sur Envoyer ; `KnowledgeBase` ajoute le message puis appelle `sendKnowledgeMessage`.
2. `sendKnowledgeMessage` -> `invokeKnowledgeChat` construit un `FormData` et effectue un POST bloquant vers `/api/functions/knowledge`.
3. L'API Express réceptionne, upload les fichiers, invoque l'Edge Function `knowledgeChat` puis attend la réponse complète.
4. La réponse JSON est renvoyée au frontend en une fois; `KnowledgeBase` ajoute le message assistant et met à jour les liens.

Le “POST bloquant” correspond donc à l'attente de l'Edge Function dans `runKnowledgeChat`, qui suspend le handler Express jusqu'à ce que l'IA ait terminé.【F:backend/src/controllers/functionsController.js†L176-L194】

## 2. Design proposé pour le streaming (backend + Supabase)
Objectif : découpler la réception HTTP initiale de la production de la réponse IA et publier des événements temps réel via Supabase Realtime.

### 2.1. Production des chunks côté backend
- **Réception HTTP courte** : `/api/functions/knowledge` garde le rôle d'orchestration (auth, upload) mais répond rapidement avec un `conversationId` et un `messageId` nouvellement créés.
- **Déclenchement du traitement** : après la réponse initiale, le backend lance l'appel IA en tâche de fond (queue interne ou worker détaché) et consomme le flux de tokens/chunks de l'Edge Function (ou du LLM) dès qu'ils arrivent.
- **Émission des événements** : chaque chunk reçu est publié sur Supabase Realtime (canal ou table). Les états `start`, `chunk`, `end`, `error` sont structurés pour permettre la reconstruction.

### 2.2. Transport via Supabase Realtime
Deux options compatibles :
1. **Canal Realtime personnalisé** (broadcast): publication sur un canal `kb_chat:<conversationId>` avec payload JSON léger. Avantage : pas d'écriture en base, latence minimale. Inconvénient : nécessite un fallback stockage si l'historique doit être persistant.
2. **Table d'événements** : insertion dans une table `kb_events` (ou `kb_messages`) avec Realtime activé sur les insertions. Avantage : persistance automatique, relecture en cas de reconnexion. Inconvénient : surcharge I/O.

Recommandation : table d'événements pour la robustesse, plus un canal broadcast optionnel pour réduire la latence si nécessaire.

### 2.3. Structure des événements
Champs minimaux (compatibles canal et table) :
- `conversation_id` (UUID) : fil de discussion.
- `message_id` (UUID) : message IA en cours.
- `event` (enum) : `start`, `chunk`, `end`, `error`.
- `content` (text, nullable) : contenu du chunk (texte brut). Vide pour `start`/`end`.
- `progress` (int, nullable) : pourcentage ou numéro de chunk (optionnel).
- `links` (jsonb, nullable) : liens enrichis détectés au fil de l'eau.
- `error` (text, nullable) : message d'erreur pour l'événement `error`.
- `created_at` (timestamp) : horodatage serveur.

### 2.4. Flux complet proposé
1. **Frontend → Backend** : POST `/api/functions/knowledge` retourne immédiatement `{ conversationId, messageId, status: 'queued' }` après validation/upload.
2. **Backend → IA** : worker lance l'appel IA en mode streaming et reçoit les tokens/chunks.
3. **Backend → Supabase** : pour chaque étape, insertion dans `kb_events` (ou publication canal) :
   - `start` : annonce la génération.
   - `chunk` : `content` partiel, `progress` optionnel.
   - `end` : marque la fin, peut contenir le message complet et les liens agrégés.
   - `error` : motif en cas d'échec.
4. **Supabase Realtime → Frontend** : le client abonné au canal/table `kb_events` filtré par `conversation_id` reçoit les mises à jour et rafraîchit l'affichage en continu.
5. **Persistance finale** : une fois `end` publié, le backend peut (optionnel) consolider le message complet dans une table `kb_messages` pour requêtes ultérieures.

## 3. Design UX/IX/IHM pour le frontend
- **Abonnement Realtime** : à la réception de `{conversationId, messageId}`, le frontend s'abonne au flux `kb_events` filtré sur `conversation_id` (et éventuellement `message_id` pour éviter les collisions multi-onglets).
- **Affichage progressif** :
  - À `start` : insérer un message assistant vide avec état « génération en cours ».
  - À chaque `chunk` : concaténer `content` et mettre à jour un indicateur de progression (spinner ou pourcentage si `progress` fourni).
  - À `end` : figer le contenu, extraire/dédupliquer les liens et désactiver l'indicateur.
  - À `error` : afficher un toast/erreur inline et permettre la relance.
- **Reconnexion et retard** : en cas de reconnexion Realtime, recharger les derniers événements de `kb_events` (requête REST) pour reconstruire l'état. Prévoir un timeout UI (ex. 45–60 s) déclenchant un message « réponse lente » si aucun `chunk` reçu.
- **Gestion multi-conv** : namespace des canaux par `conversationId` ou appliquer un filtre Realtime sur le champ `conversation_id` afin de ne pas polluer les autres conversations d'un utilisateur.

## 4. Design Supabase (tables, policies, triggers)
Tables actuelles concernées : aucune pour le chat (uniquement `kb_articles` consultée). Ajouts proposés :
- **`kb_conversations`** : métadonnées (id, user_id, created_at, title optionnelle).
- **`kb_messages`** : messages complets (id, conversation_id, role, content, links, created_at, status: `pending|streaming|done|error`). Peut être alimentée lors du `end` ou via un trigger d'agrégation.
- **`kb_events`** : streaming temps réel (structure décrite en 2.3) avec Realtime activé sur INSERT.

RLS / sécurité à prévoir (à formaliser en SQL dans une étape suivante) :
- **`kb_conversations`** : `user_id = auth.uid()` pour SELECT/INSERT/UPDATE.
- **`kb_messages`** : lecture/écriture limitée aux conversations de l'utilisateur.
- **`kb_events`** : insertions réservées au rôle service (backend) ; SELECT autorisé à `auth.uid()` pour ses conversations uniquement.

Triggers potentiels (définir plus tard) :
- Agréger automatiquement les chunks `kb_events` en message final dans `kb_messages` lorsque l'événement `end` arrive.
- Marquer un message `status='error'` si un événement `error` est inséré.
- Purger les événements anciens pour limiter la taille.

## 5. Plan des étapes suivantes
- **Backend**
  - Adapter `/api/functions/knowledge` pour répondre rapidement avec `conversationId`/`messageId` et déclencher le worker de streaming.
  - Implémenter la consommation streaming de l'Edge Function (ou du LLM) et la publication Realtime (table `kb_events` + éventuellement canal broadcast).
  - Ajouter une API REST pour relire les événements/messages consolidés (reconnexion, historiques).
- **Frontend**
  - Introduire un client Supabase Realtime (ou WebSocket équivalent) côté app shell.
  - Abonner `KnowledgeBase` aux événements `kb_events` par conversation, gérer concaténation des chunks, états `start/end/error`, et timeouts UX.
  - Afficher l'identifiant de conversation dans l'URL ou le state pour permettre la reprise.
- **Supabase**
  - Créer les tables `kb_conversations`, `kb_messages`, `kb_events`, activer Realtime sur `kb_events`.
  - Définir les RLS policies et triggers décrits ci-dessus ; documenter les commandes SQL dans le README/guide infra.
- **Tests**
  - Backend : tests d'intégration simulant le streaming (publication de plusieurs `kb_events` et reconstruction), tests unitaires sur la logique de worker.
  - Frontend : tests React pour le flux Realtime (mocks supabase-js) vérifiant l'affichage progressif et la reprise après reconnexion.
  - Tests end-to-end éventuels pour valider l'expérience utilisateur complète.

Cette étape reste purement conceptuelle et ne modifie pas le comportement existant ; la mise en œuvre sera réalisée dans les étapes ultérieures.

## 6. Notes de mise en œuvre (étape 2)
- L'API `/api/functions/knowledge` répond désormais rapidement avec `{ status: 'queued', conversationId, messageId }` après validation et upload. Le POST n'attend plus la réponse IA.
- Le backend déclenche en tâche de fond l'appel streaming vers la fonction Edge `knowledgeChat` et publie les événements `kb_events` dans l'ordre : `start`, plusieurs `chunk`, puis `end` ou `error`.
- Chaque événement contient systématiquement `conversation_id` et `message_id` pour permettre au frontend de filtrer son abonnement Supabase Realtime.
- En cas d'erreur côté IA ou Supabase, un événement `error` est publié avec un message de fallback pour que le frontend puisse réagir sans rester bloqué.
