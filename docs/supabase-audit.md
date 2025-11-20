# Audit Supabase et préparation backend

## 1. État des lieux actuel
- **Initialisation côté frontend** : le client Supabase est créé directement dans le navigateur avec les clés publiques, et un client de secours permet à l'application de continuer même sans configuration, ce qui explique le fonctionnement sans backend en place.【F:frontend/src/services/supabase/client.ts†L1-L67】
- **Authentification utilisateur** : le frontend appelle `supabase.auth` pour la connexion, l'inscription, la déconnexion et l'écoute d'état de session sans passer par l'API interne.【F:frontend/src/services/supabase/auth.ts†L10-L74】
- **Données de diagnostic** : toutes les opérations CRUD (lecture, insertion, mise à jour, suppression) sur la table `diagnoses` sont faites depuis le navigateur, y compris la signature d'URLs de stockage via Supabase.【F:frontend/src/services/supabase/diagnosis.ts†L7-L171】
- **Stockage de fichiers** : les uploads, suppressions et signatures d'URL (diagnostic, profil, connaissance) sont effectués directement via `supabase.storage` côté frontend.【F:frontend/src/services/supabase/storage.ts†L5-L128】
- **Profils utilisateurs** : création, mise à jour et lecture de la table `users_profiles` sont gérées par le frontend.【F:frontend/src/services/supabase/profile.ts†L11-L151】
- **Base de connaissances** : les articles `kb_articles` sont lus directement par le frontend.【F:frontend/src/services/supabase/knowledge.ts†L5-L22】
- **Fonctions Edge** : les appels aux fonctions d'inférence et de chat passent du frontend directement à Supabase (upload dans le bucket, création d'URLs signées, puis invocation).【F:frontend/src/features/diagnosis/services/inference.ts†L25-L131】【F:frontend/src/features/kb/services/chat.ts†L25-L67】
- **Backend existant** : aucune utilisation de Supabase depuis Express pour l'instant ; seuls les scripts d'Edge Functions Supabase initialisent un client avec la clé de service pour signer des URLs de stockage côté Supabase.【F:backend/supabase/functions/diagnosis-infer/index.ts†L35-L156】

## 2. Architecture cible (à implémenter dans l'étape suivante)
- **Principe** : le frontend ne doit plus communiquer directement avec Supabase. Tous les flux passeront par le backend (Frontend → Backend → Supabase) afin de centraliser les clés, la sécurité et la validation métier.
- **Organisation proposée côté backend** :
  - Une configuration centralisée des variables Supabase (URL, clés, buckets, fonctions) chargée via l'environnement.
  - Un client Supabase unique, non persistant, instancié côté serveur.
  - Des services dédiés (diagnostic, profils, connaissances, stockage, edge functions) encapsulant les opérations actuellement réalisées dans le frontend.
- **Points d'exposition prévus** :
  - Endpoints API REST pour : authentifier/valider les utilisateurs, gérer les diagnostics (CRUD + nettoyage stockage), gérer les profils, récupérer la base de connaissances, poster les feedbacks.
  - Endpoints proxy pour : uploader les fichiers (diagnostic, profil, knowledge), générer des URLs signées, et invoquer les fonctions Edge (diagnosis infer/knowledge chat) sans exposer de clé au navigateur.

## 3. Préparation livrée côté backend (couche Supabase)
- **Configuration environnement** : ajout d'un bloc Supabase dans la config Node (URL, clé service, clé anon optionnelle, buckets, noms de fonctions) pour centraliser tous les réglages serveur.【F:backend/src/config/env.js†L5-L23】
- **Fichier d'exemple `.env`** : gabarit fourni pour renseigner les variables Supabase côté backend sans les exposer au frontend.【F:backend/.env.example†L1-L18】
- **Client Supabase serveur** : création d'un client unique initialisé avec la clé service, avec validation stricte des variables requises.【F:backend/src/services/supabaseClient.js†L1-L24】
- **Service métier Supabase** : nouveau module regroupant les opérations nécessaires (diagnostics, profils, base de connaissances, feedbacks), la gestion du stockage (upload, suppression, URLs signées) et l'invocation des fonctions Edge, prêt à être branché sur des routes Express ultérieures.【F:backend/src/services/supabaseService.js†L12-L193】

## 4. Migration progressive recommandée
1. Créer des endpoints Express qui délèguent au `supabaseService` (diagnostics, profils, feedback, connaissances, stockage, fonctions Edge).
2. Introduire une vérification d'identité côté backend (ex : token Supabase, session propre au backend) et faire passer l'ID utilisateur aux appels Supabase.
3. Côté frontend, remplacer progressivement chaque appel direct par l'appel REST équivalent (auth → API, diagnostics → API, stockage → API, fonctions Edge via API proxy), en conservant des wrappers pour limiter le diff.
4. Retirer l'initialisation Supabase dans le frontend une fois tous les appels migrés et validés.
