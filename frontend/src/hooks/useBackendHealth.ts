import { useCallback, useEffect, useState } from 'react';
import { fetchHealth } from '@/services/api/health';

export type BackendHealthStatus = 'unknown' | 'ok' | 'error';

export type BackendHealthState = {
  status: BackendHealthStatus;
  lastChecked: Date | null;
  error?: string;
  isChecking: boolean;
};

export const useBackendHealth = () => {
  const [state, setState] = useState<BackendHealthState>({
    status: 'unknown',
    lastChecked: null,
    error: undefined,
    isChecking: false
  });

  const refresh = useCallback(async () => {
    setState((previous) => ({ ...previous, isChecking: true }));
    try {
      const response = await fetchHealth();
      setState({
        status: response.status === 'ok' ? 'ok' : 'error',
        lastChecked: new Date(),
        error: response.status === 'ok' ? undefined : 'API is not healthy',
        isChecking: false
      });
    } catch (error) {
      setState({
        status: 'error',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unable to reach API',
        isChecking: false
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
};
