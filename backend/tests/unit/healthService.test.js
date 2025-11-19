import { describe, expect, it } from 'vitest';
import { getHealthStatus } from '../../src/services/healthService.js';

describe('healthService', () => {
  it('returns an ok status', () => {
    const result = getHealthStatus();
    expect(result).toEqual({ status: 'ok' });
  });
});
