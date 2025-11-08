import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { runInference } from './inference';
import { invokeEdgeFunction } from '@/services/supabase/functions';
import { uploadDiagnosisImages } from '@/services/supabase/storage';
import { appConfig } from '@/services/config';

vi.mock('@/services/supabase/functions');
vi.mock('@/services/supabase/storage');

const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

const mockInvoke = invokeEdgeFunction as unknown as Mock;
const mockUpload = uploadDiagnosisImages as unknown as Mock;

describe('runInference', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUpload.mockResolvedValue(['diagnosis-images/user/file.jpg']);
  });

  it('returns edge function response when available', async () => {
    mockInvoke.mockResolvedValue({
      id: 'diag-1',
      crop: 'Maïs',
      stage: 'Végétatif',
      symptoms: ['Taches'],
      context: 'Observation',
      createdAt: '2024-01-01T00:00:00.000Z',
      status: 'sick',
      confidence: 0.82,
      primary: {
        label: 'Anthracnose',
        confidence: 0.82,
        status: 'sick',
        description: 'Detected anthracnose'
      },
      alternatives: [
        {
          label: 'Carence azotée',
          confidence: 0.45,
          status: 'stressed',
          description: 'Possible nutrient deficiency'
        }
      ],
      actions: ['Inspect']
    });

    const result = await runInference({
      crop: 'Maïs',
      stage: 'Végétatif',
      symptoms: ['Taches'],
      context: 'Observation',
      files: [mockFile]
    });

    expect(mockUpload).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith(
      appConfig.supabase.functions.diagnosisInfer,
      expect.objectContaining({
        body: expect.objectContaining({
          model: appConfig.gemini.model
        })
      })
    );
    expect(result.id).toBe('diag-1');
    expect(result.primary.label).toBe('Anthracnose');
    expect(result.alternatives).toHaveLength(1);
  });

  it('falls back to synthetic diagnosis when edge function fails', async () => {
    mockInvoke.mockRejectedValue(new Error('Edge failure'));

    const result = await runInference({
      crop: 'Riz',
      stage: 'Floraison',
      symptoms: ['Chlorose'],
      context: 'Test',
      files: [mockFile]
    });

    expect(result.primary.label).toContain('Riz');
    expect(result.status).toBeDefined();
  });

  it('defaults missing payload data from edge response', async () => {
    mockInvoke.mockResolvedValue({
      primary: {
        label: 'Healthy crop',
        confidence: 0.5,
        status: 'healthy',
        description: 'Baseline'
      },
      alternatives: []
    });

    const result = await runInference({
      crop: 'Blé',
      stage: 'Semis',
      symptoms: [],
      context: 'Observation',
      files: [mockFile]
    });

    expect(result.crop).toBe('Blé');
    expect(result.primary.label).toBe('Healthy crop');
    expect(result.status).toBe('healthy');
  });
});
