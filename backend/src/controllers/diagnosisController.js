import { supabaseService } from '../services/supabaseService.js';

const parseUserId = (req) => req.user?.id;

export const listDiagnoses = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    const data = await supabaseService.fetchDiagnosesForUser(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const createDiagnosis = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    const payload = { ...req.body, user_id: userId };
    await supabaseService.upsertDiagnosis(payload);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateDiagnosisResolved = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    const { resolved } = req.body || {};
    await supabaseService.updateDiagnosisResolved(req.params.id, userId, Boolean(resolved));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateDiagnosisDetails = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    const updates = req.body || {};
    await supabaseService.updateDiagnosisDetails(req.params.id, userId, updates);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteDiagnosis = async (req, res, next) => {
  try {
    const userId = parseUserId(req);
    const { imagePaths = [] } = req.body || {};
    await supabaseService.deleteDiagnosis(req.params.id, userId);
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
    const { useful, comment } = req.body || {};
    const payload = { diagnosis_id: req.params.id, useful: Boolean(useful), comment: comment ?? null };
    await supabaseService.submitDiagnosisFeedback(payload);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};
