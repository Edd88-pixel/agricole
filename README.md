# Agricole – Guide d'installation

Ce dépôt contient l'application web Agricole (React + TypeScript + Tailwind) et son backend Supabase. Ce document décrit uniquement les étapes d'installation et de configuration pour un environnement de développement ou d'intégration.

## 1. Prérequis

- Node.js 20+
- npm 10+
- Supabase CLI ≥ 1.190
- Accès à un projet Supabase configuré (URL, clés, buckets, Edge Functions)

## 2. Installation locale

1. **Cloner le dépôt**
   ```bash
   git clone <votre-url> agricole && cd agricole
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   Renseignez ensuite les variables suivantes avec vos valeurs :
   ```ini
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

## 3. Provisionnement Supabase

1. **Connexion et liaison du projet**
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
2. **Migration de la base de données**
   - Placez vos scripts SQL dans `supabase/migrations`.
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

- **Développement**
  ```bash
  npm run dev
  ```
- **Tests**
  ```bash
  npm test
  ```
- **Build de production**
  ```bash
  npm run build
  ```

## 5. Dépannage rapide

- Vérifiez que `.env` est complet et chargé par Vite.
- Assurez-vous que `supabase link` référence bien le bon projet.
- Lancez `npm run lint` ou `npm run test -- --watch` pour diagnostiquer les erreurs locales.

Ce manuel est volontairement limité à l'installation. Pour toute autre documentation (fonctionnalités, design, roadmap), conservez-la dans des documents internes ou un wiki privé.
