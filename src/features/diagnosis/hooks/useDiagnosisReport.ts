import { useCallback, useState } from 'react';
import type { DiagnosisResult } from '../types/diagnosis';
import { generateDiagnosisReport, type ReportOptions } from '../services/report';

const sanitizeFileName = (input: string) => input.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');

export const useDiagnosisReport = (options?: ReportOptions) => {
  const [isGenerating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(
    async (result: DiagnosisResult) => {
      setGenerating(true);
      setError(null);
      try {
        const blob = await generateDiagnosisReport(result, options);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const date = new Date(result.createdAt);
        const timestamp = date.toISOString().split('T')[0] ?? 'report';
        anchor.href = url;
        anchor.download = `${timestamp}-${sanitizeFileName(result.crop || 'diagnosis')}.pdf`;
        anchor.rel = 'noopener';
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to generate diagnosis report', err);
        setError((err as Error).message);
      } finally {
        setGenerating(false);
      }
    },
    [options]
  );

  return { generateReport, isGenerating, error };
};

export type UseDiagnosisReportReturn = ReturnType<typeof useDiagnosisReport>;
