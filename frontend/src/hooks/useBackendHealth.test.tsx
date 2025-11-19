import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { fetchHealth } from '@/services/api/health';
import { useBackendHealth } from './useBackendHealth';

vi.mock('@/services/api/health', () => ({
  fetchHealth: vi.fn()
}));

const mockedFetchHealth = fetchHealth as unknown as Mock;

describe('useBackendHealth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sets status to ok when API responds', async () => {
    mockedFetchHealth.mockResolvedValue({ status: 'ok' });

    const { result } = renderHook(() => useBackendHealth());

    await waitFor(() => expect(result.current.status).toBe('ok'));
    expect(result.current.error).toBeUndefined();
    expect(result.current.lastChecked).not.toBeNull();
  });

  it('surfaces errors from failed calls', async () => {
    mockedFetchHealth.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBackendHealth());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toContain('Network error');

    mockedFetchHealth.mockResolvedValue({ status: 'ok' });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('ok');
  });
});
