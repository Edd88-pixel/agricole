/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly REACT_APP_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly REACT_APP_SUPABASE_ANON_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
