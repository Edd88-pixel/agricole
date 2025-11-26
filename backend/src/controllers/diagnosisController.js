import { supabaseService } from '../services/supabaseService.js';
import { buildHttpError, ensureBoolean, isNonEmptyString, toNonEmptyString, toStringArray } from '../utils/validation.js';

const parseUserId = (req) => req.user?.id;

const sanitizeImages = (value) => toStringArray(value);

const validateDiagnosisPayload = (body, userId) => {
  const errors = [];
  const id = toNonEmptyString(body?.id);
  const crop = toNonEmptyString(body?.crop);
  const stage = toNonEmptyString(body?.stage);

  if (!id) errors.push('id');
  if (!crop) errors.push('crop');
  if (!stage) errors.push('stage');

  const payload = {
    id,
    crop,
    stage,
    symptoms: toStringArray(body?.symptoms),
    context: toNonEmptyString(body?.context),
    created_at: toNonEmptyString(body?.created_at),
    status: toNonEmptyString(body?.status) || undefined,
    confidence: typeof body?.confidence === 'number' ? body.confidence : undefined,
    primary: body?.primary && typeof body.primary === 'object' ? body.primary : undefined,
    alternatives: Array.isArray(body?.alternatives) ? body.alternatives : undefined,
    actions: Array.isArray(body?.actions) ? body.actions : undefined,
    images: sanitizeImages(body?.images ?? body?.imagePaths),
    resolved: ensureBoolean(body?.resolved) ?? false,
    user_id: userId
  };

  const sanitizedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  if (errors.length > 0) {
    throw buildHttpError(`Missing or invalid fields: ${errors.join(', ')}`, 400);
  }

  return sanitizedPayload;
};

export const listDiagnoses = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }
    const data = await supabaseService.fetchDiagnosesForUser(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const createDiagnosis = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }

    const payload = validateDiagnosisPayload(req.body || {}, userId);
    await supabaseService.upsertDiagnosis(payload);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateDiagnosisResolved = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }
    const diagnosisId = toNonEmptyString(req.params?.id);
    if (!diagnosisId) {
      throw buildHttpError('Diagnosis id is required', 400);
    }
    const resolved = ensureBoolean(req.body?.resolved);

    if (resolved === null) {
      throw buildHttpError('"resolved" flag must be a boolean', 400);
    }

    await supabaseService.updateDiagnosisResolved(diagnosisId, userId, resolved);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateDiagnosisDetails = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }
    const diagnosisId = toNonEmptyString(req.params?.id);
    if (!diagnosisId) {
      throw buildHttpError('Diagnosis id is required', 400);
    }
    const updates = {};

    if (isNonEmptyString(req.body?.context)) {
      updates.context = toNonEmptyString(req.body.context);
    }

    if (isNonEmptyString(req.body?.stage)) {
      updates.stage = toNonEmptyString(req.body.stage);
    }

    const symptoms = toStringArray(req.body?.symptoms);
    if (symptoms.length > 0) {
      updates.symptoms = symptoms;
    }

    if (Object.keys(updates).length === 0) {
      throw buildHttpError('No valid fields to update', 400);
    }

    await supabaseService.updateDiagnosisDetails(diagnosisId, userId, updates);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteDiagnosis = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }
    const diagnosisId = toNonEmptyString(req.params?.id);
    if (!diagnosisId) {
      throw buildHttpError('Diagnosis id is required', 400);
    }
    const rawPaths = req.body?.imagePaths ?? req.body?.paths;
    if (rawPaths && (!Array.isArray(rawPaths) || rawPaths.some((path) => typeof path !== 'string' || !path.trim()))) {
      throw buildHttpError('All image paths must be non-empty strings', 400);
    }

    const imagePaths = toStringArray(rawPaths);

    await supabaseService.deleteDiagnosis(diagnosisId, userId);
    if (imagePaths.length > 0) {
      await supabaseService.removeFromBucket(imagePaths, supabaseService.defaultBuckets.diagnosis);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      throw buildHttpError('Unauthorized', 401);
    }

    const diagnosisId = toNonEmptyString(req.params?.id);
    if (!diagnosisId) {
      throw buildHttpError('Diagnosis id is required', 400);
    }
    const useful = ensureBoolean(req.body?.useful);
    if (useful === null) {
      throw buildHttpError('Feedback usefulness must be a boolean', 400);
    }

    const comment = toNonEmptyString(req.body?.comment);
    if (comment && comment.length > 500) {
      throw buildHttpError('Feedback comment is too long', 400);
    }

    const payload = { diagnosis_id: diagnosisId, user_id: userId, useful, comment: comment || null };
    await supabaseService.submitDiagnosisFeedback(payload);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};
