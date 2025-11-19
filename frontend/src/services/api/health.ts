import { apiClient } from './client';

export type HealthResponse = {
  status: string;
  timestamp?: string;
};

export const fetchHealth = async () => apiClient.get<HealthResponse>('/api/health');
