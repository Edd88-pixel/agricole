import { config } from '../config/env.js';
import { buildHttpError } from '../utils/validation.js';
import { getSupabaseClient } from './supabaseClient.js';

const supabase = () => getSupabaseClient();

const mapSupabaseError = (error, context) => {
  if (!error) return null;
  if (error.code === 'PGRST116' || error.code === 'PGRST404' || error.status === 404 || error.status === 406) {
    return buildHttpError('Resource not found', 404);
  }

  const status = typeof error.status === 'number' && error.status >= 400 ? error.status : 502;
  const detail = error?.message ? `: ${error.message}` : '';
  const message =
    status >= 500
      ? `${context || 'Unexpected service error'}${detail}`
      : error.message || context || 'Request failed';

  return buildHttpError(message, status);
};

const ensurePresent = (value, message, status = 400) => {
  if (!value) {
    throw buildHttpError(message, status);
  }
};

const handleResult = (data, error, { context, notFoundMessage } = {}) => {
  const mappedError = mapSupabaseError(error, context);
  if (mappedError) throw mappedError;

  if (notFoundMessage) {
    const isEmptyArray = Array.isArray(data) && data.length === 0;
    if (!data || isEmptyArray) {
      throw buildHttpError(notFoundMessage, 404);
    }
  }
};

const wrapSupabaseCall = async (fn, options = {}) => {
  try {
    const { data, error } = await fn();
    handleResult(data, error, options);
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Supabase call failed', { context: options?.context, error });
    if (error?.status) throw error;
    throw buildHttpError(options?.context || 'Upstream service unavailable', 502);
  }
};

const tables = {
  diagnoses: 'diagnoses',
  knowledge: 'kb_articles',
  profiles: 'users_profiles',
  feedback: 'diagnosis_feedback'
};

const buckets = {
  diagnosis: config.supabase.storageBuckets.diagnosis,
  profile: config.supabase.storageBuckets.profile,
  knowledge: config.supabase.storageBuckets.knowledge || config.supabase.storageBuckets.diagnosis,
  reports: config.supabase.storageBuckets.reports
};

export const supabaseService = {
  async fetchDiagnosesForUser(userId) {
    ensurePresent(userId, 'User id is required', 401);

    const data = await wrapSupabaseCall(
      () =>
        supabase()
          .from(tables.diagnoses)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      { context: 'Failed to fetch diagnoses' }
    );

    return data ?? [];
  },

  async upsertDiagnosis(payload) {
    ensurePresent(payload?.id, 'Diagnosis id is required');
    ensurePresent(payload?.user_id, 'User id is required', 401);

    await wrapSupabaseCall(
      () => supabase().from(tables.diagnoses).upsert(payload, { onConflict: 'id' }),
      { context: 'Failed to upsert diagnosis' }
    );
  },

  async updateDiagnosisResolved(id, userId, resolved) {
    ensurePresent(id, 'Diagnosis id is required');
    ensurePresent(userId, 'User id is required', 401);

    await wrapSupabaseCall(
      () =>
        supabase()
          .from(tables.diagnoses)
          .update({ resolved })
          .eq('id', id)
          .eq('user_id', userId)
          .select('id')
          .single(),
      { context: 'Failed to update diagnosis resolution', notFoundMessage: 'Diagnosis not found' }
    );
  },

  async updateDiagnosisDetails(id, userId, updates) {
    ensurePresent(id, 'Diagnosis id is required');
    ensurePresent(userId, 'User id is required', 401);

    await wrapSupabaseCall(
      () =>
        supabase()
          .from(tables.diagnoses)
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select('id')
          .single(),
      { context: 'Failed to update diagnosis details', notFoundMessage: 'Diagnosis not found' }
    );
  },

  async deleteDiagnosis(id, userId) {
    ensurePresent(id, 'Diagnosis id is required');
    ensurePresent(userId, 'User id is required', 401);

    await wrapSupabaseCall(
      () =>
        supabase()
          .from(tables.diagnoses)
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .select('id')
          .single(),
      { context: 'Failed to delete diagnosis', notFoundMessage: 'Diagnosis not found' }
    );
  },

  async fetchKnowledgeArticles() {
    const data = await wrapSupabaseCall(
      () => supabase().from(tables.knowledge).select('*'),
      { context: 'Failed to fetch knowledge base articles' }
    );
    return data ?? [];
  },

  async fetchProfile(userId) {
    ensurePresent(userId, 'User id is required', 401);

    const data = await wrapSupabaseCall(
      () =>
        supabase()
          .from(tables.profiles)
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
      { context: 'Failed to fetch profile' }
    );
    return data ?? null;
  },

  async createProfile(payload) {
    ensurePresent(payload?.id, 'User id is required to create profile', 401);

    const data = await wrapSupabaseCall(
      () => supabase().from(tables.profiles).insert(payload).select().single(),
      { context: 'Failed to create profile' }
    );
    return data;
  },

  async updateProfile(userId, updates) {
    ensurePresent(userId, 'User id is required', 401);

    const data = await wrapSupabaseCall(
      () =>
        supabase()
          .from(tables.profiles)
          .update(updates)
          .eq('id', userId)
          .select()
          .single(),
      { context: 'Failed to update profile', notFoundMessage: 'Profile not found' }
    );
    return data;
  },

  async saveOnboardingProfile(userId, onboardingPayload) {
    return this.updateProfile(userId, {
      objectives: onboardingPayload.objectives,
      location: onboardingPayload.location,
      crops: onboardingPayload.crops,
      onboarding_completed: true
    });
  },

  async submitDiagnosisFeedback(payload) {
    ensurePresent(payload?.diagnosis_id, 'Diagnosis id is required for feedback');

    await wrapSupabaseCall(
      () => supabase().from(tables.feedback).insert(payload),
      { context: 'Failed to submit diagnosis feedback' }
    );
  },

  async uploadToBucket({ bucket, path, body, contentType = 'application/octet-stream' }) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to upload.');
    }

    const data = await wrapSupabaseCall(
      () =>
        supabase()
          .storage.from(bucket)
          .upload(path, body, {
            cacheControl: '3600',
            upsert: true,
            contentType
      }),
      { context: `Failed to upload to bucket ${bucket}` }
    );
    return data?.path ?? path;
  },

  async createSignedUrls(paths, { bucket = buckets.diagnosis, expiresIn = 600 } = {}) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to sign URLs.');
    }

    if (!paths || paths.length === 0) {
      return [];
    }

    const data = await wrapSupabaseCall(
      () => supabase().storage.from(bucket).createSignedUrls(paths, expiresIn),
      { context: `Failed to create signed URLs for bucket ${bucket}` }
    );

    return (data ?? []).map((item) => item.signedUrl);
  },

  async createSignedUrl(path, { bucket = buckets.profile, expiresIn = 600 } = {}) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to sign URL.');
    }

    const data = await wrapSupabaseCall(
      () => supabase().storage.from(bucket).createSignedUrl(path, expiresIn),
      { context: `Failed to create signed URL for bucket ${bucket}` }
    );

    return data?.signedUrl ?? '';
  },

  async removeFromBucket(paths, bucket = buckets.diagnosis) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to remove files.');
    }

    if (!paths || paths.length === 0) {
      return;
    }

    await wrapSupabaseCall(
      () => supabase().storage.from(bucket).remove(paths),
      { context: `Failed to remove files from bucket ${bucket}` }
    );
  },

  async invokeEdgeFunction(name, body, headers) {
    if (!name) {
      throw new Error('Function name is required to invoke a Supabase Edge Function.');
    }

    const isUrl = /^https?:\/\//i.test(name);
    const serviceKey = config.supabase.serviceRoleKey;

    // Prefer direct HTTP call when a full URL is provided 
    if (isUrl) {
      const target = name;
      const resolvedHeaders = {
        'Content-Type': 'application/json',
        ...(serviceKey ? { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } : {}),
        ...(headers ?? {})
      };

      const response = await fetch(target, {
        method: 'POST',
        headers: resolvedHeaders,
        body: JSON.stringify(body ?? {})
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw buildHttpError(
          text || `Failed to invoke edge function ${name}`,
          typeof response.status === 'number' ? response.status : 502
        );
      }

      return response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();
    }

    const data = await wrapSupabaseCall(
      () =>
        supabase().functions.invoke(name, {
          body,
          headers: { 'Content-Type': 'application/json', ...(headers ?? {}) }
        }),
      { context: `Failed to invoke edge function ${name}` }
    );
    return data;
  },

  defaultBuckets: buckets,
  defaultFunctions: config.supabase.functions
};
