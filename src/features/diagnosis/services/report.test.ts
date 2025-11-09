import { Buffer } from 'buffer';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { generateDiagnosisReport } from './report';
import type { DiagnosisResult } from '../types/diagnosis';

const sampleResult: DiagnosisResult = {
  id: 'diag-1',
  crop: 'Maïs',
  stage: 'Végétatif',
  symptoms: ['Taches foliaires', 'Jaunissement'],
  context: 'Observé après forte pluie.',
  createdAt: '2024-05-01T10:00:00.000Z',
  status: 'stressed',
  confidence: 0.68,
  primary: {
    label: 'Suspicion de Cercosporiose',
    confidence: 0.68,
    status: 'stressed',
    description: 'Présence de lésions ovales et humidité élevée'
  },
  alternatives: [
    {
      label: 'Carence azotée',
      confidence: 0.32,
      status: 'stressed',
      description: 'Décoloration diffuse'
    }
  ],
  actions: ['Mettre en place un suivi hebdomadaire', 'Analyser le sol pour NPK'],
  images: []
};

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAucB9Yk7nGkAAAAASUVORK5CYII=';

const toArrayBuffer = (base64: string) => {
  const buffer = Buffer.from(base64, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

describe('generateDiagnosisReport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a PDF blob with minimal payload', async () => {
    const blob = await generateDiagnosisReport(sampleResult, { locale: 'fr-FR' });
    expect(blob instanceof (globalThis as any).Blob).toBe(true);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(500);
  });

  it('embeds provided imagery via fetch', async () => {
    const arrayBuffer = toArrayBuffer(PNG_BASE64);
    const mockFetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => arrayBuffer,
      headers: new Headers({ 'Content-Type': 'image/png' })
    } as Response));

    vi.stubGlobal('fetch', mockFetch);

    const blob = await generateDiagnosisReport({ ...sampleResult, images: ['https://example.com/image.png'] });
    expect(blob.size).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.png');
  });

  it('falls back to inline data URLs without fetch', async () => {
    const dataUrl = `data:image/png;base64,${PNG_BASE64}`;
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    const blob = await generateDiagnosisReport({ ...sampleResult, images: [dataUrl] });
    expect(blob.size).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
