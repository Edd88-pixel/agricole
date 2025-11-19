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
