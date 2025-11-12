import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';
import type { KnowledgeArticle } from '@/features/kb/types/article';

const TABLE = 'kb_articles';

type KnowledgeRow = KnowledgeArticle & {
  created_at?: string;
};

const ensurePostgrest = (error: PostgrestError | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

export const fetchKnowledgeArticles = async (): Promise<KnowledgeArticle[]> => {
  const { data, error } = await supabase.from(TABLE).select('*');
  ensurePostgrest(error);

  return (data ?? []) as KnowledgeRow[];
};
