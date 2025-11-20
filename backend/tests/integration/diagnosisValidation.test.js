import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDiagnosis,
  deleteDiagnosis,
  submitFeedback,
  updateDiagnosisDetails,
  updateDiagnosisResolved
} from '../../src/controllers/diagnosisController.js';
import { supabaseService } from '../../src/services/supabaseService.js';
import { errorHandler, notFoundHandler } from '../../src/middlewares/errorHandler.js';
import { buildHttpError } from '../../src/utils/validation.js';

vi.mock('../../src/services/supabaseService.js', () => ({
  supabaseService: {
    fetchDiagnosesForUser: vi.fn(),
    upsertDiagnosis: vi.fn(),
    updateDiagnosisResolved: vi.fn(),
    updateDiagnosisDetails: vi.fn(),
    deleteDiagnosis: vi.fn(),
    removeFromBucket: vi.fn(),
    submitDiagnosisFeedback: vi.fn(),
    defaultBuckets: { diagnosis: 'diagnosis', knowledge: 'knowledge', profile: 'profile' }
  }
}));

const attachUser = (req, _res, next) => {
  req.user = { id: 'user-123' };
  next();
};

const buildApp = () => {
  const app = express();
  app.use(express.json());

  app.post('/diagnoses', attachUser, createDiagnosis);
  app.patch('/diagnoses/:id/resolved', attachUser, updateDiagnosisResolved);
  app.patch('/diagnoses/:id', attachUser, updateDiagnosisDetails);
  app.delete('/diagnoses/:id', attachUser, deleteDiagnosis);
  app.post('/diagnoses/:id/feedback', attachUser, submitFeedback);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

describe('diagnosisController validation', () => {
  const app = buildApp();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing mandatory fields on creation', async () => {
    const response = await request(app).post('/diagnoses').send({ stage: 'germination' });

    expect(response.status).toBe(400);
    expect(supabaseService.upsertDiagnosis).not.toHaveBeenCalled();
  });

  it('creates a diagnosis with sanitized payload', async () => {
    const payload = {
      id: 'diag-1',
      crop: 'Maize',
      stage: 'Seedling',
      symptoms: 'yellow, wilted',
      imagePaths: ['path/one.jpg', ''],
      user_id: 'should-be-overwritten'
    };

    const response = await request(app).post('/diagnoses').send(payload);

    expect(response.status).toBe(201);
    expect(supabaseService.upsertDiagnosis).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'diag-1',
        crop: 'Maize',
        stage: 'Seedling',
        user_id: 'user-123',
        images: ['path/one.jpg'],
        symptoms: ['yellow', 'wilted']
      })
    );
  });

  it('requires a boolean for resolved updates', async () => {
    const response = await request(app).patch('/diagnoses/diag-1/resolved').send({ resolved: 'yes' });

    expect(response.status).toBe(400);
    expect(supabaseService.updateDiagnosisResolved).not.toHaveBeenCalled();
  });

  it('filters out unsupported update fields', async () => {
    const response = await request(app)
      .patch('/diagnoses/diag-1')
      .send({ context: '  Updated ', ignore: 'x' });

    expect(response.status).toBe(200);
    expect(supabaseService.updateDiagnosisDetails).toHaveBeenCalledWith('diag-1', 'user-123', {
      context: 'Updated'
    });
  });

  it('rejects invalid image paths on delete', async () => {
    const response = await request(app).delete('/diagnoses/diag-1').send({ imagePaths: ['ok', 5] });

    expect(response.status).toBe(400);
    expect(supabaseService.deleteDiagnosis).not.toHaveBeenCalled();
  });

  it('validates feedback payload', async () => {
    const longComment = 'a'.repeat(501);
    const response = await request(app)
      .post('/diagnoses/diag-1/feedback')
      .send({ useful: true, comment: longComment });

    expect(response.status).toBe(400);
    expect(supabaseService.submitDiagnosisFeedback).not.toHaveBeenCalled();
  });

  it('rejects empty diagnosis ids on updates', async () => {
    const response = await request(app)
      .patch('/diagnoses/%20/resolved')
      .send({ resolved: true });

    expect(response.status).toBe(400);
    expect(supabaseService.updateDiagnosisResolved).not.toHaveBeenCalled();
  });

  it('propagates not found errors from the data layer', async () => {
    supabaseService.updateDiagnosisResolved.mockRejectedValueOnce(buildHttpError('Diagnosis not found', 404));

    const response = await request(app)
      .patch('/diagnoses/missing-id/resolved')
      .send({ resolved: true });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Diagnosis not found');
  });
});
