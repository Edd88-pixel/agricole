import { supabaseService } from '../services/supabaseService.js';
import { buildHttpError, isNonEmptyString, toNonEmptyString, toStringArray } from '../utils/validation.js';

const getUserId = (req) => req.user?.id;

export const getProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }
    const data = await supabaseService.fetchProfile(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }

    const payload = {
      id: userId,
      first_name: toNonEmptyString(req.body?.first_name) || undefined,
      last_name: toNonEmptyString(req.body?.last_name) || undefined,
      full_name: toNonEmptyString(req.body?.full_name) || undefined,
      location: toNonEmptyString(req.body?.location) || undefined,
      objectives: toStringArray(req.body?.objectives),
      crops: toStringArray(req.body?.crops)
    };
    const data = await supabaseService.createProfile(payload);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }

    const updates = {};
    if (isNonEmptyString(req.body?.first_name)) updates.first_name = toNonEmptyString(req.body.first_name);
    if (isNonEmptyString(req.body?.last_name)) updates.last_name = toNonEmptyString(req.body.last_name);
    if (isNonEmptyString(req.body?.full_name)) updates.full_name = toNonEmptyString(req.body.full_name);
    if (isNonEmptyString(req.body?.location)) updates.location = toNonEmptyString(req.body.location);

    const objectives = toStringArray(req.body?.objectives);
    if (objectives.length > 0) updates.objectives = objectives;

    const crops = toStringArray(req.body?.crops);
    if (crops.length > 0) updates.crops = crops;

    if (Object.keys(updates).length === 0) {
      throw buildHttpError('No valid profile fields to update', 400);
    }

    const data = await supabaseService.updateProfile(userId, updates);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const saveOnboarding = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }

    const onboardingPayload = {
      objectives: toStringArray(req.body?.objectives),
      location: toNonEmptyString(req.body?.location),
      crops: toStringArray(req.body?.crops)
    };

    if (onboardingPayload.objectives.length === 0 && onboardingPayload.crops.length === 0 && !onboardingPayload.location) {
      throw buildHttpError('Onboarding payload is invalid', 400);
    }

    const data = await supabaseService.saveOnboardingProfile(userId, onboardingPayload);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
