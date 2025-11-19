import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/services/config', () => ({
  appConfig: { apiBaseUrl: 'http://localhost:5001' }
}));

const mockFetch = vi.fn();

global.fetch = mockFetch as unknown as typeof fetch;

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('builds requests with the configured base URL', async () => {
    const { apiClient } = await import('./client');
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const response = await apiClient.get<{ status: string }>('/api/health', { query: { ping: 'pong' } });

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:5001/api/health?ping=pong', expect.anything());
    expect(response.status).toBe('ok');
  });

  it('throws an ApiError with status code on failure', async () => {
    const { apiClient, ApiError } = await import('./client');
    mockFetch.mockResolvedValue(new Response('nope', { status: 500 }));

    let thrown: unknown;

    try {
      await apiClient.get('/broken');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect((thrown as ApiError).status).toBe(500);
  });
});
