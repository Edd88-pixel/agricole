import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { runInference } from './inference';
import { invokeDiagnosisInference } from '@/services/api/functions';
import { appConfig } from '@/services/config';

vi.mock('@/services/api/functions');

const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

const mockInvoke = invokeDiagnosisInference as unknown as Mock;

describe('runInference', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      actions: ['Inspect'],
      images: ['https://cdn.example/report.jpg']
    });

    const result = await runInference({
      crop: 'Maïs',
      stage: 'Végétatif',
      symptoms: ['Taches'],
      context: 'Observation',
      files: [mockFile]
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      expect.objectContaining({
        crop: 'Maïs',
        stage: 'Végétatif',
        context: 'Observation',
        symptoms: ['Taches'],
        model: appConfig.gemini.model
      })
    );
    expect(result.id).toBe('diag-1');
    expect(result.primary.label).toBe('Anthracnose');
    expect(result.alternatives).toHaveLength(1);
    expect(result.images).toContain('https://cdn.example/report.jpg');
    expect(result.imagePaths).toEqual(['https://cdn.example/report.jpg']);
  });

  it('throws when the edge function fails', async () => {
    mockInvoke.mockRejectedValue(new Error('Edge failure'));

    await expect(
      runInference({
        crop: 'Riz',
        stage: 'Floraison',
        symptoms: ['Chlorose'],
        context: 'Test',
        files: [mockFile]
      })
    ).rejects.toThrow('Edge failure');
  });

  it('defaults optional fields when edge response omits them', async () => {
    mockInvoke.mockResolvedValue({
      id: 'diag-2',
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
    expect(result.images).toEqual([]);
    expect(result.imagePaths).toEqual([]);
  });

  it('throws if inference response is empty', async () => {
    mockInvoke.mockResolvedValue({});

    await expect(
      runInference({
        crop: 'Coton',
        stage: 'Végétatif',
        symptoms: ['Nécrose'],
        context: 'Cas test',
        files: [mockFile]
      })
    ).rejects.toThrow('Incomplete response from edge inference.');
  });

  it('throws if called without images', async () => {
    await expect(
      runInference({
        crop: 'Tomate',
        stage: 'Floraison',
        symptoms: ['Nécrose'],
        context: 'Cas test',
        files: []
      })
    ).rejects.toThrow('At least one image is required for inference.');
  });
});
