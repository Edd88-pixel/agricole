import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { runInference } from './inference';
import { invokeEdgeFunction } from '@/services/supabase/functions';
import { createSignedDiagnosisUrls, uploadDiagnosisImages } from '@/services/supabase/storage';
import { appConfig } from '@/services/config';

vi.mock('@/services/supabase/functions');
vi.mock('@/services/supabase/storage');

const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

const mockInvoke = invokeEdgeFunction as unknown as Mock;
const mockUpload = uploadDiagnosisImages as unknown as Mock;
const mockSignUrls = createSignedDiagnosisUrls as unknown as Mock;

describe('runInference', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUpload.mockResolvedValue(['diagnosis-images/user/file.jpg']);
    mockSignUrls.mockResolvedValue(['https://example.com/image.jpg']);

    class FileReaderMock {
      public result: string | ArrayBuffer | null = null;
      public onload: null | (() => void) = null;
      public onerror: null | (() => void) = null;
      readAsDataURL() {
        this.result = 'data:image/jpeg;base64,ZmFrZQ==' as const;
        if (this.onload) {
          this.onload();
        }
      }
    }

    vi.stubGlobal('FileReader', FileReaderMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    expect(result.images).toContain('https://cdn.example/report.jpg');
    expect(result.imagePaths).toEqual(['diagnosis-images/user/file.jpg']);
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
    expect(result.images[0]).toBe('https://example.com/image.jpg');
    expect(result.imagePaths).toEqual(['diagnosis-images/user/file.jpg']);
  });

  it('throws if images cannot be uploaded', async () => {
    mockUpload.mockResolvedValue([]);

    await expect(
      runInference({
        crop: 'Coton',
        stage: 'Végétatif',
        symptoms: ['Nécrose'],
        context: 'Cas test',
        files: [mockFile]
      })
    ).rejects.toThrow('No images were uploaded');
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
    ).rejects.toThrow('At least one image is required');
  });
});
