import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DiagnosisResult } from '@/features/diagnosis/types/diagnosis';
import type { HistoryEntry } from '@/features/history/types/history';
import type { KnowledgeArticle } from '@/features/kb/types/article';
import { fetchDiagnoses, insertDiagnosis, updateDiagnosisResolved, deleteDiagnosis, updateDiagnosisDetails } from '@/services/api/diagnosis';
import { fetchKnowledgeArticles } from '@/services/api/knowledge';
import { getAccessToken } from '@/services/authTokens';

const MAX_HISTORY = 20;

const toHistoryEntry = (result: DiagnosisResult, resolved = false): HistoryEntry => ({
  ...result,
  imagePaths: result.imagePaths ?? [],
  resolved
});

export const useSupabaseData = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | undefined>(getAccessToken());

  // React to auth token changes (sign-in / sign-out)
  useEffect(() => {
    const syncTokens = () => setAuthToken(getAccessToken());
    window.addEventListener('storage', syncTokens);
    window.addEventListener('agricole-auth-tokens-changed', syncTokens);
    return () => {
      window.removeEventListener('storage', syncTokens);
      window.removeEventListener('agricole-auth-tokens-changed', syncTokens);
    };
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const records = await fetchDiagnoses();
      setHistory(records.slice(0, MAX_HISTORY));
    } catch (error) {
      console.error('Failed to load diagnoses from backend', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setArticlesLoading(true);
    try {
      const records = await fetchKnowledgeArticles();
      setArticles(records);
    } catch (error) {
      console.error('Failed to load knowledge base from backend', error);
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authToken) {
      setHistory([]);
      setArticles([]);
      setHistoryLoading(false);
      setArticlesLoading(false);
      return;
    }
    void loadHistory();
    void loadArticles();
  }, [authToken, loadArticles, loadHistory]);

  const addResultToHistory = useCallback(
    async (result: DiagnosisResult) => {
      setHistory((previous) => [toHistoryEntry(result), ...previous].slice(0, MAX_HISTORY));
      try {
        await insertDiagnosis(result);
        await loadHistory();
      } catch (error) {
        console.error('Failed to persist diagnosis to Supabase', error);
      }
    },
    [loadHistory]
  );

  const toggleResolved = useCallback(
    async (id: string) => {
      let nextResolved = true;
      setHistory((previous) =>
        previous.map((entry) => {
          if (entry.id === id) {
            nextResolved = !entry.resolved;
            return { ...entry, resolved: nextResolved };
          }
          return entry;
        })
      );
      try {
        await updateDiagnosisResolved(id, nextResolved);
      } catch (error) {
        console.error('Failed to update diagnosis resolved status in Supabase', error);
        await loadHistory();
      }
    },
    [loadHistory]
  );

  const removeDiagnosis = useCallback(
    async (id: string) => {
      const snapshot = history;
      const removed = snapshot.find((entry) => entry.id === id);
      setHistory((previous) => previous.filter((entry) => entry.id !== id));

      try {
        await deleteDiagnosis(id, removed?.imagePaths ?? []);
      } catch (error) {
        console.error('Failed to delete diagnosis from Supabase', error);
        setHistory([...snapshot]);
        throw error;
      }
    },
    [history]
  );

  const updateDiagnosis = useCallback(
    async (id: string, updates: { context: string; stage: string }) => {
      setHistory((previous) =>
        previous.map((entry) => {
          if (entry.id === id) {
            return { ...entry, context: updates.context, stage: updates.stage };
          }
          return entry;
        })
      );

      try {
        await updateDiagnosisDetails(id, updates);
      } catch (error) {
        console.error('Failed to update diagnosis details in Supabase', error);
        await loadHistory();
        throw error;
      }
    },
    [loadHistory]
  );

  return useMemo(
    () => ({
      history,
      historyLoading,
      articles,
      articlesLoading,
      addResultToHistory,
      toggleResolved,
      removeDiagnosis,
      updateDiagnosis
    }),
    [
      addResultToHistory,
      articles,
      articlesLoading,
      history,
      historyLoading,
      toggleResolved,
      removeDiagnosis,
      updateDiagnosis
    ]
  );
};

export type SupabaseDataContext = ReturnType<typeof useSupabaseData>;
