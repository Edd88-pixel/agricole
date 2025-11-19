import type { DiagnosisResult } from '@/features/diagnosis/types/diagnosis';

export type HistoryEntry = DiagnosisResult & {
  resolved: boolean;
};
