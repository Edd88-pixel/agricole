import { supabaseService } from '../services/supabaseService.js';

const getUserId = (req) => req.user?.id;

export const getProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await supabaseService.fetchProfile(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const payload = { ...req.body, id: userId };
    const data = await supabaseService.createProfile(payload);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await supabaseService.updateProfile(userId, req.body || {});
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const saveOnboarding = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await supabaseService.saveOnboardingProfile(userId, req.body || {});
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
