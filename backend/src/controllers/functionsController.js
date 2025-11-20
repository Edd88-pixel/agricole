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

export const runDiagnosisInference = async (req, res, next) => {
  try {
    const { crop, stage, symptoms, context, model } = req.body || {};
    const owner = req.user?.id;
    const files = req.files || [];
    const symptomsArray = Array.isArray(symptoms) ? symptoms : typeof symptoms === 'string' ? symptoms.split(',') : [];

    const uploadedPaths = await uploadFilesToBucket(files, supabaseService.defaultBuckets.diagnosis, owner);
    const signedUrls = await supabaseService.createSignedUrls(uploadedPaths, {
      bucket: supabaseService.defaultBuckets.diagnosis
    });

    const payload = {
      crop,
      stage,
      symptoms: symptomsArray,
      context,
      imagePaths: uploadedPaths,
      images: uploadedPaths,
      signedUrls,
      signedImagePaths: signedUrls,
      query: `${crop} | ${stage}`
    };

    if (model) {
      payload.model = model;
    }

    const result = await supabaseService.invokeEdgeFunction(
      supabaseService.defaultFunctions.diagnosisInfer,
      payload
    );

    res.json({ data: { ...result, imagePaths: uploadedPaths, signedUrls } });
  } catch (error) {
    next(error);
  }
};

export const runKnowledgeChat = async (req, res, next) => {
  try {
    const { prompt } = req.body || {};
    const history = (() => {
      if (Array.isArray(req.body?.history)) return req.body.history;
      if (typeof req.body?.history === 'string') {
        try {
          return JSON.parse(req.body.history);
        } catch {
          return [];
        }
      }
      return [];
    })();
    const owner = req.user?.id;
    const files = req.files || [];
    const uploadedPaths = await uploadFilesToBucket(
      files,
      supabaseService.defaultBuckets.knowledge,
      owner
    );
    const signedUrls = await supabaseService.createSignedUrls(uploadedPaths, {
      bucket: supabaseService.defaultBuckets.knowledge
    });
    const accessibleImages = signedUrls.length > 0 ? signedUrls : uploadedPaths;

    const payload = {
      prompt,
      history,
      imagePaths: uploadedPaths,
      signedUrls,
      bucket: supabaseService.defaultBuckets.knowledge,
      query: prompt,
      message: prompt,
      messages: history,
      images: accessibleImages,
      signedImagePaths: signedUrls
    };

    const result = await supabaseService.invokeEdgeFunction(
      supabaseService.defaultFunctions.knowledgeChat,
      payload
    );

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};
