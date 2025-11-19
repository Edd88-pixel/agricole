import { fetchSystemStatus } from '../models/systemStatus.js';

export const getHealthStatus = () => fetchSystemStatus();
