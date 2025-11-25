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

    const firstName = toNonEmptyString(req.body?.first_name ?? req.body?.firstName);
    const lastName = toNonEmptyString(req.body?.last_name ?? req.body?.lastName);
    const email = toNonEmptyString(req.body?.email ?? req.user?.email);
    const emailName = email ? email.split('@')[0] || email : '';
    const displayName =
      toNonEmptyString(req.body?.display_name ?? req.body?.displayName) ||
      toNonEmptyString(req.user?.user_metadata?.full_name) ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      toNonEmptyString(emailName) ||
      'Producer';
    const avatarPath = toNonEmptyString(req.body?.avatar_path ?? req.body?.avatarPath) || undefined;
    const locale = toNonEmptyString(req.body?.locale ?? req.user?.user_metadata?.locale) || undefined;
    const onboardingFlag = req.body?.onboarding_completed ?? req.body?.onboardingCompleted;
    const onboardingCompleted = typeof onboardingFlag === 'boolean' ? onboardingFlag : undefined;

    const payload = {
      id: userId,
      email: email || undefined,
      display_name: displayName,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      avatar_path: avatarPath,
      locale,
      location: toNonEmptyString(req.body?.location) || undefined,
      onboarding_completed: onboardingCompleted,
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
    const firstName = toNonEmptyString(req.body?.first_name ?? req.body?.firstName);
    if (firstName) updates.first_name = firstName;

    const lastName = toNonEmptyString(req.body?.last_name ?? req.body?.lastName);
    if (lastName) updates.last_name = lastName;

    const displayName = toNonEmptyString(req.body?.display_name ?? req.body?.displayName);
    if (displayName) updates.display_name = displayName;

    const avatarPath = req.body?.avatar_path ?? req.body?.avatarPath;
    if (isNonEmptyString(avatarPath)) {
      updates.avatar_path = toNonEmptyString(avatarPath);
    } else if (avatarPath === null) {
      updates.avatar_path = null;
    }

    if (isNonEmptyString(req.body?.location)) updates.location = toNonEmptyString(req.body.location);

    const locale = toNonEmptyString(req.body?.locale);
    if (locale) updates.locale = locale;

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
