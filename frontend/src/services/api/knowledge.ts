import { apiClient } from './client';
import type { KnowledgeArticle } from '@/features/kb/types/article';

export const fetchKnowledgeArticles = async (): Promise<KnowledgeArticle[]> => {
  const { data } = await apiClient.get<{ data: KnowledgeArticle[] }>('api/knowledge');
  return data ?? [];
};
