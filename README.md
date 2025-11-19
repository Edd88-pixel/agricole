# Agricole – Guide d'installation

Ce dépôt contient l'application web Agricole (React + TypeScript + Tailwind) et un backend Node/Express minimal pour servir d'API. Le dossier racine est désormais organisé en deux parties :

- `frontend/` : application React (Vite + TypeScript + Tailwind + Supabase)
- `backend/` : serveur Express minimal (point d'entrée API, dossier Supabase)

Ce document décrit uniquement les étapes d'installation et de configuration pour un environnement de développement ou d'intégration.

## 1. Prérequis

- Node.js 20+
- npm 10+
- Supabase CLI ≥ 1.190
- Accès à un projet Supabase configuré (URL, clés, buckets, Edge Functions)

## Architecture backend

Le backend est désormais organisé en couches explicites :

- `src/config/` : chargement des variables d'environnement et configuration des logs.
- `src/middlewares/` : middlewares applicatifs (logger HTTP, gestion des 404 et des erreurs).
- `src/routes/` : définition des endpoints (préfixés par `/api`).
- `src/controllers/` : gestion des requêtes/réponses HTTP.
- `src/services/` : logique métier et orchestration des données.
- `src/models/` : accès aux données ou modèles métiers.

Le point d'entrée applicatif est `src/app.js` (montage d'Express) et le serveur est lancé depuis `server.js`.

### Ports et endpoints principaux

- API HTTP : `http://localhost:4000`
- Endpoint de healthcheck : `GET /api/health` → `{ "status": "ok" }`

## 2. Installation locale

1. **Cloner le dépôt**
   ```bash
   git clone <votre-url> agricole && cd agricole
   ```
2. **Installer les dépendances**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
3. **Configurer les variables d'environnement**
   - Frontend
     ```bash
     cd frontend
     cp .env.example .env
     ```
     Variables disponibles :
     ```ini
     VITE_API_BASE_URL=http://localhost:4000
     VITE_SUPABASE_URL=https://<your-project>.supabase.co
     VITE_SUPABASE_ANON_KEY=<public-anon-key>
     VITE_GEMINI_MODEL=gemini-2.5-flash
     VITE_SUPABASE_STORAGE_BUCKET_DIAGNOSIS=<bucket-name>
     VITE_SUPABASE_STORAGE_BUCKET_REPORTS=<bucket-name>
     VITE_SUPABASE_STORAGE_BUCKET_PROFILE=<bucket-name>
     VITE_SUPABASE_FUNCTION_DIAGNOSIS=<edge-function-name>
     VITE_SUPABASE_FUNCTION_KNOWLEDGE=<edge-function-name>
     SUPABASE_GEMINI_API_KEY=<server-side-api-key>
     ```
   - Backend
     ```bash
     cd ../backend
     cp .env.example .env
     ```
     Par défaut, seul le port du serveur est requis :
     ```ini
     PORT=4000
     ```

## 3. Provisionnement Supabase

1. **Connexion et liaison du projet**
   ```bash
   cd backend
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
2. **Migration de la base de données**
   - Placez vos scripts SQL dans `backend/supabase/migrations`.
   - Appliquez-les avec :
     ```bash
     supabase db push
     ```
3. **Edge Functions**
   - Déployez les fonctions nécessaires (diagnosis, knowledge, etc.) :
     ```bash
     supabase functions deploy <function-name>
     ```
4. **Stockage**
   - Créez les buckets attendus:
     ```bash
     supabase storage create-bucket diagnosis-images --public
     ```
   - Répétez pour chaque bucket référencé dans `.env`.

## 4. Lancement et tests

### Backend

- **Installer les dépendances**
  ```bash
  cd backend
  npm install
  ```

- **Démarrer l'API en développement** (port par défaut : `4000`)
  ```bash
  npm run dev
  ```

- **Tests unitaires**
  ```bash
  npm run test:unit
  ```

- **Tests d'intégration**
  ```bash
  npm run test:integration
  ```

- **Suite complète des tests backend**
  ```bash
  npm test
  ```

### Frontend

- **Installer les dépendances**
  ```bash
  cd frontend
  npm install
  ```
- **Lancer le frontend** (dans un second terminal)
  ```bash
  cd frontend
  npm run dev
  ```
- **Tests frontend**
  ```bash
  cd frontend
  npm test
  ```
- **Build de production**
  ```bash
  cd frontend
  npm run build
  ```

## 5. Intégration frontend / backend

- Le frontend lit l'URL de base de l'API via la variable `VITE_API_BASE_URL` (voir `.env` dans `frontend/`).
- L'URL de base par défaut est `http://localhost:4000`; elle correspond au port du backend Express.
- Les appels HTTP sont centralisés dans `frontend/src/services/api/client.ts`, qui ajoute le préfixe `/api` (ex. `GET /api/health`).
- Le backend expose CORS en mode permissif (entête `Access-Control-Allow-Origin: *`), ce qui permet à Vite (`http://localhost:5173`) ou à une build de production de communiquer sans configuration additionnelle.
- Pour un déploiement plus strict, vous pouvez fixer l'origine autorisée en configurant `cors()` dans `backend/src/app.js` (optionnel, non requis pour le développement local).

## 6. Tests API avec Postman

- **URL de base** : `http://localhost:4000` (variable d'environnement suggérée dans Postman : `apiBaseUrl`).
- **Authentification/headers** : aucun token n'est requis pour l'instant ; accepter les réponses JSON (`Accept: application/json`).
- **Endpoints principaux** :

  | Méthode | Chemin                      | Paramètres | Corps attendu | Réponse attendue |
  |---------|----------------------------|------------|---------------|------------------|
  | GET     | `{{apiBaseUrl}}/api/health` | Aucun      | N/A           | `200 OK`, JSON `{ "status": "ok" }` |

- **Configurer un environnement Postman** :
  1. Créez un environnement `Agricole Local` avec la variable `apiBaseUrl` = `http://localhost:4000`.
  2. Ajoutez une requête `GET {{apiBaseUrl}}/api/health` dans une collection `Agricole API`.
  3. Optionnel : ajoutez l'entête `Accept: application/json` pour forcer le parseur JSON de Postman.
  4. Exécutez la requête ; vous devez obtenir un corps `{ "status": "ok" }` et vérifier que l'entête `Access-Control-Allow-Origin` est présent.

> Lorsque d'autres endpoints seront ajoutés (authentification, CRUD, etc.), suivez la même convention : préfixe `/api`, URL de base injectée via `VITE_API_BASE_URL` côté frontend et variable `apiBaseUrl` dans Postman.

## Architecture frontend

- **App shell et layout** : `src/components/layout` contient l'enveloppe globale et les menus ; `src/pages` regroupe les vues routées (tableau de bord, historique, médiathèque, etc.).
- **Composants UI réutilisables** : `src/components/ui` rassemble les primitives visuelles (boutons, badges de statut, skeletons...).
- **Services** :
  - `src/services/api` centralise les appels HTTP vers le backend Express via `apiClient` (base URL : `VITE_API_BASE_URL`).
  - `src/services/supabase` encapsule l'accès Supabase (auth, stockage, edge functions).
- **Hooks** : `src/hooks` expose la logique métier partagée (`useSupabaseData`, `useUserProfile`, `useBackendHealth`, etc.).

### Variables d'environnement frontend

- `VITE_API_BASE_URL` : URL de base de l'API Express (ex. `http://localhost:4000`).
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` : configuration Supabase.
- Autres variables optionnelles : `VITE_GEMINI_MODEL`, buckets de stockage (`VITE_SUPABASE_STORAGE_BUCKET_*`) et noms de fonctions Edge (`VITE_SUPABASE_FUNCTION_*`).

## 7. Dépannage rapide

- Vérifiez que `.env` est complet et chargé par Vite.
- Assurez-vous que `supabase link` référence bien le bon projet.
- Lancez `npm run lint` ou `npm run test -- --watch` pour diagnostiquer les erreurs locales.

Ce manuel est volontairement limité à l'installation. Pour toute autre documentation (fonctionnalités, design, roadmap), conservez-la dans des documents internes ou un wiki privé.
