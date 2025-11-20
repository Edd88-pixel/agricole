import { randomUUID } from 'crypto';
import { supabaseService } from '../services/supabaseService.js';

const inferExtension = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'bin';
};

const buildPath = (owner, file) => `${owner || 'anonymous'}/${Date.now()}-${randomUUID()}.${inferExtension(file.originalname)}`;

const uploadFilesToBucket = async (files, bucket, owner) => {
  const uploaded = [];
  for (const file of files) {
    const path = buildPath(owner, file);
    await supabaseService.uploadToBucket({
      bucket,
      path,
      body: file.buffer,
      contentType: file.mimetype || 'application/octet-stream'
    });
    uploaded.push(path);
  }
  return uploaded;
};

export const uploadDiagnosisImages = async (req, res, next) => {
  try {
    const owner = req.user?.id;
    const paths = await uploadFilesToBucket(
      req.files || [],
      supabaseService.defaultBuckets.diagnosis,
      owner
    );
    res.status(201).json({ paths });
  } catch (error) {
    next(error);
  }
};

export const uploadKnowledgeAttachments = async (req, res, next) => {
  try {
    const owner = req.user?.id;
    const paths = await uploadFilesToBucket(
      req.files || [],
      supabaseService.defaultBuckets.knowledge,
      owner
    );
    res.status(201).json({ paths });
  } catch (error) {
    next(error);
  }
};

export const uploadProfileAvatar = async (req, res, next) => {
  try {
    const owner = req.user?.id;
    const [file] = req.files || [];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const [path] = await uploadFilesToBucket([file], supabaseService.defaultBuckets.profile, owner);
    res.status(201).json({ path });
  } catch (error) {
    next(error);
  }
};

export const createDiagnosisSignedUrls = async (req, res, next) => {
  try {
    const { paths = [], expiresIn } = req.body || {};
    const signedUrls = await supabaseService.createSignedUrls(paths, {
      bucket: supabaseService.defaultBuckets.diagnosis,
      expiresIn
    });
    res.json({ signedUrls });
  } catch (error) {
    next(error);
  }
};

export const createKnowledgeSignedUrls = async (req, res, next) => {
  try {
    const { paths = [], expiresIn } = req.body || {};
    const signedUrls = await supabaseService.createSignedUrls(paths, {
      bucket: supabaseService.defaultBuckets.knowledge,
      expiresIn
    });
    res.json({ signedUrls });
  } catch (error) {
    next(error);
  }
};

export const createProfileSignedUrl = async (req, res, next) => {
  try {
    const { path, expiresIn } = req.body || {};
    const signedUrl = await supabaseService.createSignedUrl(path, {
      bucket: supabaseService.defaultBuckets.profile,
      expiresIn
    });
    res.json({ signedUrl });
  } catch (error) {
    next(error);
  }
};

export const removeDiagnosisImages = async (req, res, next) => {
  try {
    const { paths = [] } = req.body || {};
    await supabaseService.removeFromBucket(paths, supabaseService.defaultBuckets.diagnosis);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const removeProfileAvatar = async (req, res, next) => {
  try {
    const { path } = req.body || {};
    if (path) {
      await supabaseService.removeFromBucket([path], supabaseService.defaultBuckets.profile);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
