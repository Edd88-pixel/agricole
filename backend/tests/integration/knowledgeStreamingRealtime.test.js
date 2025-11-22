import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runKnowledgeChat } from '../../src/controllers/functionsController.js';
import { errorHandler, notFoundHandler } from '../../src/middlewares/errorHandler.js';
import { supabaseService } from '../../src/services/supabaseService.js';

vi.mock('../../src/services/supabaseService.js', () => ({
  supabaseService: {
    invokeEdgeFunction: vi.fn(),
    streamEdgeFunction: vi.fn(),
    publishKnowledgeEvent: vi.fn(),
    createSignedUrls: vi.fn().mockResolvedValue([]),
    uploadToBucket: vi.fn(),
    defaultBuckets: { knowledge: 'knowledge' },
    defaultFunctions: { knowledgeChat: 'kb-edge' }
  }
}));

const attachUser = (req, _res, next) => {
  req.user = { id: 'user-123' };
  next();
};

const buildApp = () => {
  const app = express();
  app.use(express.json());

  app.post('/functions/knowledge', attachUser, runKnowledgeChat);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

describe('knowledge streaming realtime events', () => {
  const app = buildApp();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('publishes start, chunk and end events in order', async () => {
    supabaseService.streamEdgeFunction.mockReturnValue(
      (async function* () {
        yield 'Hello ';
        yield 'world';
      })()
    );

    const response = await request(app)
      .post('/functions/knowledge')
      .send({ prompt: 'Stream please', history: [] });

    expect(response.status).toBe(202);
    expect(response.body.data.status).toBe('queued');

    await new Promise((resolve) => setImmediate(resolve));

    const events = supabaseService.publishKnowledgeEvent.mock.calls.map(([payload]) => payload.event);
    expect(events).toEqual(['start', 'chunk', 'chunk', 'end']);

    const endEvent = supabaseService.publishKnowledgeEvent.mock.calls.at(-1)?.[0];
    expect(endEvent?.content).toBe('Hello world');
  });

  it('publishes an error event when streaming fails', async () => {
    supabaseService.streamEdgeFunction.mockReturnValue(
      (async function* () {
        throw new Error('stream failed');
      })()
    );

    const response = await request(app)
      .post('/functions/knowledge')
      .send({ prompt: 'Trigger error', history: [] });

    expect(response.status).toBe(202);

    await new Promise((resolve) => setImmediate(resolve));

    const events = supabaseService.publishKnowledgeEvent.mock.calls.map(([payload]) => payload.event);
    expect(events[0]).toBe('start');
    expect(events[1]).toBe('error');
    const errorPayload = supabaseService.publishKnowledgeEvent.mock.calls[1][0];
    expect(errorPayload.error).toMatch(/stream failed/);
    expect(errorPayload.content).toMatch(/Le traitement Supabase Edge est indisponible/);
  });
});
