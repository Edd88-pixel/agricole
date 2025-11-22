import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runDiagnosisInference, runKnowledgeChat } from '../../src/controllers/functionsController.js';
import { errorHandler, notFoundHandler } from '../../src/middlewares/errorHandler.js';
import { supabaseService } from '../../src/services/supabaseService.js';

vi.mock('../../src/services/supabaseService.js', () => ({
  supabaseService: {
    invokeEdgeFunction: vi.fn(),
    streamEdgeFunction: vi.fn(),
    publishKnowledgeEvent: vi.fn(),
    createSignedUrls: vi.fn().mockResolvedValue([]),
    uploadToBucket: vi.fn(),
    defaultBuckets: { diagnosis: 'diagnosis', knowledge: 'knowledge' },
    defaultFunctions: { diagnosisInfer: 'diag-edge', knowledgeChat: 'kb-edge' }
  }
}));

const attachUser = (req, _res, next) => {
  req.user = { id: 'user-123' };
  next();
};

const buildApp = () => {
  const app = express();
  app.use(express.json());

  app.post('/functions/diagnosis', attachUser, runDiagnosisInference);
  app.post('/functions/knowledge', attachUser, runKnowledgeChat);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

describe('functionsController fallbacks', () => {
  const app = buildApp();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a fallback diagnosis response when edge invocation fails', async () => {
    supabaseService.invokeEdgeFunction.mockRejectedValueOnce(new Error('edge-down'));

    const response = await request(app)
      .post('/functions/diagnosis')
      .send({ crop: 'Maize', stage: 'Seedling', symptoms: ['yellow'] });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toMatch(/local-diag-/);
    expect(response.body.data.crop).toBe('Maize');
  });

  it('returns a fallback knowledge response when edge invocation fails', async () => {
    const response = await request(app)
      .post('/functions/knowledge')
      .send({ prompt: 'Quels sont les symptômes ?', history: [] });

    expect(response.status).toBe(202);
    expect(response.body.data.status).toBe('queued');
    expect(response.body.data.conversationId).toBeTruthy();
    expect(response.body.data.messageId).toBeTruthy();
  });
});

