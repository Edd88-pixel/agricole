import { supabaseService } from '../services/supabaseService.js';
import {
  buildHttpError,
  clampArray,
  isNonEmptyString,
  toNonEmptyString,
  toStringArray
} from '../utils/validation.js';
import { uploadFilesToBucket } from '../utils/storage.js';

const buildDiagnosisFallback = (payload, uploadedPaths, signedUrls) => {
  const images = signedUrls.length > 0 ? signedUrls : uploadedPaths;
  const timestamp = new Date().toISOString();

  return {
    id: `local-diag-${Date.now()}`,
    crop: payload.crop,
    stage: payload.stage,
    symptoms: payload.symptoms,
    context: payload.context,
    createdAt: timestamp,
    status: 'stressed',
    confidence: 0.5,
    primary: {
      label: 'Analyse locale',
      description:
        'Service d\'inférence Supabase indisponible. Résultat généré localement pour permettre la continuité.',
      confidence: 0.5,
      status: 'stressed'
    },
    alternatives: [],
    actions: ['Vérifiez la configuration Supabase ou relancez plus tard.'],
    images,
    imagePaths: uploadedPaths
  };
};

const buildKnowledgeFallback = (payload, images) => ({
  id: `local-kb-${Date.now()}`,
  createdAt: new Date().toISOString(),
  message:
    'Le traitement Supabase Edge est indisponible. Voici un rappel de votre question et des informations fournies.',
  images,
  links: [],
  echo: {
    prompt: payload.prompt,
    history: payload.history
  }
});

export const runDiagnosisInference = async (req, res, next) => {
  try {
    const { context, model } = req.body || {};
    const crop = toNonEmptyString(req.body?.crop);
    const stage = toNonEmptyString(req.body?.stage);
    const symptoms = toStringArray(req.body?.symptoms);

    if (!crop || !stage) {
      throw buildHttpError('Crop and stage are required', 400);
    }

    const owner = req.user?.id;
    const files = clampArray(req.files || [], 5);
    const symptomsArray = clampArray(symptoms, 10);

    if (files.length === 0 && symptomsArray.length === 0 && !context) {
      throw buildHttpError('At least one symptom, image or context is required', 400);
    }

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
    ).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('Edge diagnosis invocation failed, using fallback', error);
      return buildDiagnosisFallback(payload, uploadedPaths, signedUrls);
    });

    res.json({ data: { ...result, imagePaths: uploadedPaths, signedUrls } });
  } catch (error) {
    next(error);
  }
};

export const runKnowledgeChat = async (req, res, next) => {
  try {
    const prompt = toNonEmptyString(req.body?.prompt);
    if (!prompt) {
      throw buildHttpError('Prompt is required', 400);
    }

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
    })()
      .filter((item) => item && isNonEmptyString(item.role) && isNonEmptyString(item.content))
      .map((item) => ({ role: item.role.trim(), content: item.content.trim() }));
    const boundedHistory = clampArray(history, 20);
    const owner = req.user?.id;
    const files = clampArray(req.files || [], 5);
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
      history: boundedHistory,
      imagePaths: uploadedPaths,
      signedUrls,
      bucket: supabaseService.defaultBuckets.knowledge,
      query: prompt,
      message: prompt,
      messages: boundedHistory,
      images: accessibleImages,
      signedImagePaths: signedUrls
    };

    const result = await supabaseService.invokeEdgeFunction(
      supabaseService.defaultFunctions.knowledgeChat,
      payload
    ).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('Edge knowledge invocation failed, using fallback', error);
      return buildKnowledgeFallback(payload, accessibleImages);
    });

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};
