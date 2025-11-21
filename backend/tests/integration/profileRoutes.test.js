import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateProfile } from '../../src/controllers/profileController.js';
import { errorHandler, notFoundHandler } from '../../src/middlewares/errorHandler.js';
import { supabaseService } from '../../src/services/supabaseService.js';

vi.mock('../../src/services/supabaseService.js', () => ({
  supabaseService: {
    fetchProfile: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    saveOnboardingProfile: vi.fn()
  }
}));

const attachUser = (req, _res, next) => {
  req.user = { id: 'user-123' };
  next();
};

const buildApp = () => {
  const app = express();
  app.use(express.json());

  app.patch('/profile', attachUser, updateProfile);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

describe('profileController update', () => {
  const app = buildApp();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows updating locale without other fields', async () => {
    supabaseService.updateProfile.mockResolvedValueOnce({ id: 'user-123', locale: 'en' });

    const response = await request(app).patch('/profile').send({ locale: 'en' });

    expect(response.status).toBe(200);
    expect(response.body.data.locale).toBe('en');
    expect(supabaseService.updateProfile).toHaveBeenCalledWith('user-123', { locale: 'en' });
  });
});

