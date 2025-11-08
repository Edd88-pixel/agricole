import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { supabase } from '@/services/supabase/client';
import type { DiagnosisResult } from '@/features/diagnosis/types/diagnosis';
import type { KnowledgeArticle } from '@/features/kb/types/article';
import {
  fetchDiagnoses,
  insertDiagnosis,
  updateDiagnosisResolved
} from '@/services/supabase/diagnosis';
import { fetchKnowledgeArticles } from '@/services/supabase/knowledge';
import { useSupabaseData } from './useSupabaseData';

vi.mock('@/services/supabase/diagnosis');
vi.mock('@/services/supabase/knowledge');
vi.mock('@/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
    }
  }
}));

const sampleDiagnosis: DiagnosisResult = {
  id: '1',
  crop: 'Maize',
  stage: 'Vegetative',
  symptoms: ['Leaf spots'],
  context: 'Observed in plot A',
  createdAt: new Date().toISOString(),
  status: 'stressed',
  confidence: 0.6,
  primary: {
    label: 'Leaf blight',
    confidence: 0.6,
    status: 'stressed',
    description: 'Likely leaf blight'
  },
  alternatives: [],
  actions: ['Monitor']
};

const sampleArticle: KnowledgeArticle = {
  id: 'kb-1',
  crop: 'Maize',
  symptom: 'Leaf spots',
  title: 'Leaf spot management',
  summary: 'Guidance for handling leaf spots.',
  content: 'Detailed content',
  locale: 'en'
};

describe('useSupabaseData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    (fetchDiagnoses as unknown as Mock).mockResolvedValue([]);
    (fetchKnowledgeArticles as unknown as Mock).mockResolvedValue([sampleArticle]);
    (insertDiagnosis as unknown as Mock).mockResolvedValue(undefined);
    (updateDiagnosisResolved as unknown as Mock).mockResolvedValue(undefined);
  });

  it('loads history and articles from Supabase', async () => {
    (fetchDiagnoses as unknown as Mock).mockResolvedValueOnce([
      { ...sampleDiagnosis, resolved: false }
    ]);

    const { result } = renderHook(() => useSupabaseData());

    await waitFor(() => expect(result.current.historyLoading).toBe(false));

    expect(result.current.history).toHaveLength(1);
    expect(result.current.articles[0]?.id).toBe(sampleArticle.id);
  });

  it('optimistically adds a new diagnosis to history', async () => {
    const { result } = renderHook(() => useSupabaseData());
    await waitFor(() => expect(result.current.historyLoading).toBe(false));

    (fetchDiagnoses as unknown as Mock).mockResolvedValueOnce([
      { ...sampleDiagnosis, resolved: false }
    ]);

    await act(async () => {
      await result.current.addResultToHistory(sampleDiagnosis);
    });

    expect(insertDiagnosis).toHaveBeenCalledWith(sampleDiagnosis);
    expect(result.current.history[0]?.id).toBe(sampleDiagnosis.id);
  });

  it('toggles resolved state and syncs with Supabase', async () => {
    (fetchDiagnoses as unknown as Mock).mockResolvedValueOnce([
      { ...sampleDiagnosis, resolved: false }
    ]);

    const { result } = renderHook(() => useSupabaseData());
    await waitFor(() => expect(result.current.historyLoading).toBe(false));

    await act(async () => {
      await result.current.toggleResolved(sampleDiagnosis.id);
    });

    expect(updateDiagnosisResolved).toHaveBeenCalledWith(sampleDiagnosis.id, true);
  });
});
