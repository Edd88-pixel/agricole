import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DiagnosisResult } from '@/features/diagnosis/types/diagnosis';
import type { HistoryEntry } from '@/features/history/types/history';
import type { KnowledgeArticle } from '@/features/kb/types/article';
import {
  fetchDiagnoses,
  insertDiagnosis,
  updateDiagnosisResolved
} from '@/services/supabase/diagnosis';
import { fetchKnowledgeArticles } from '@/services/supabase/knowledge';
import { supabase } from '@/services/supabase/client';

const MAX_HISTORY = 20;

const toHistoryEntry = (result: DiagnosisResult, resolved = false): HistoryEntry => ({
  ...result,
  resolved
});

export const useSupabaseData = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse?.data?.session;
      if (!session) {
        setHistory([]);
        return;
      }
      const records = await fetchDiagnoses();
      setHistory(records.slice(0, MAX_HISTORY));
    } catch (error) {
      console.error('Failed to load diagnoses from Supabase', error);
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
      console.error('Failed to load knowledge base from Supabase', error);
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    void loadArticles();
  }, [loadHistory, loadArticles]);

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

  return useMemo(
    () => ({
      history,
      historyLoading,
      articles,
      articlesLoading,
      addResultToHistory,
      toggleResolved
    }),
    [addResultToHistory, articles, articlesLoading, history, historyLoading, toggleResolved]
  );
};

export type SupabaseDataContext = ReturnType<typeof useSupabaseData>;
