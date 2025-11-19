import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../src/app.js';

let server;

beforeAll(() => {
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('GET /api/health', () => {
  it('responds with ok status', async () => {
    const response = await request(server).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
