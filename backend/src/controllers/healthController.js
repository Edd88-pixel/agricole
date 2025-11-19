import { getHealthStatus } from '../services/healthService.js';

export const getHealth = (_req, res) => {
  const status = getHealthStatus();
  res.json(status);
};
