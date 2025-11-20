import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDiagnosisSignedUrls,
  createKnowledgeSignedUrls,
  removeDiagnosisImages,
  uploadDiagnosisImages
} from '../../src/controllers/storageController.js';
import { supabaseService } from '../../src/services/supabaseService.js';

vi.mock('../../src/services/supabaseService.js', () => ({
  supabaseService: {
    uploadToBucket: vi.fn(),
    createSignedUrls: vi.fn().mockResolvedValue(['signed-url']),
    removeFromBucket: vi.fn(),
    defaultBuckets: { diagnosis: 'diagnosis', knowledge: 'knowledge', profile: 'profile' }
  }
}));

const attachUser = (req, _res, next) => {
  req.user = { id: 'user-123' };
  next();
};

const withFiles = (files = []) => (req, _res, next) => {
  req.files = files;
  next();
};

const buildApp = () => {
  const app = express();
  app.use(express.json());

  app.post('/storage/diagnosis/sign', createDiagnosisSignedUrls);
  app.post('/storage/knowledge/sign', createKnowledgeSignedUrls);
  app.delete('/storage/diagnosis', removeDiagnosisImages);
  app.post('/storage/diagnosis/upload', attachUser, withFiles(), uploadDiagnosisImages);

  return app;
};

describe('storageController validation', () => {
  const app = buildApp();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requires paths when signing diagnosis URLs', async () => {
    const response = await request(app).post('/storage/diagnosis/sign').send({ paths: [] });
    expect(response.status).toBe(400);
    expect(supabaseService.createSignedUrls).not.toHaveBeenCalled();
  });

  it('requires paths when signing knowledge URLs', async () => {
    const response = await request(app).post('/storage/knowledge/sign').send({});
    expect(response.status).toBe(400);
  });

  it('rejects delete requests without paths', async () => {
    const response = await request(app).delete('/storage/diagnosis').send({});
    expect(response.status).toBe(400);
    expect(supabaseService.removeFromBucket).not.toHaveBeenCalled();
  });

  it('requires at least one file when uploading diagnosis images', async () => {
    const response = await request(app).post('/storage/diagnosis/upload');
    expect(response.status).toBe(400);
    expect(supabaseService.uploadToBucket).not.toHaveBeenCalled();
  });
});
