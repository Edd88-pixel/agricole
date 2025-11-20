import { config } from '../config/env.js';
import { getSupabaseClient } from './supabaseClient.js';

const supabase = getSupabaseClient();

const throwWithContext = (error, context) => {
  if (!error) return;
  const message = context ? `${context}: ${error.message}` : error.message;
  throw new Error(message);
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
    const { data, error } = await supabase
      .from(tables.diagnoses)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    throwWithContext(error, 'Failed to fetch diagnoses');

    return data ?? [];
  },

  async upsertDiagnosis(payload) {
    const { error } = await supabase.from(tables.diagnoses).upsert(payload, { onConflict: 'id' });
    throwWithContext(error, 'Failed to upsert diagnosis');
  },

  async updateDiagnosisResolved(id, userId, resolved) {
    const { error } = await supabase
      .from(tables.diagnoses)
      .update({ resolved })
      .eq('id', id)
      .eq('user_id', userId);

    throwWithContext(error, 'Failed to update diagnosis resolution');
  },

  async updateDiagnosisDetails(id, userId, updates) {
    const { error } = await supabase
      .from(tables.diagnoses)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    throwWithContext(error, 'Failed to update diagnosis details');
  },

  async deleteDiagnosis(id, userId) {
    const { error } = await supabase
      .from(tables.diagnoses)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    throwWithContext(error, 'Failed to delete diagnosis');
  },

  async fetchKnowledgeArticles() {
    const { data, error } = await supabase.from(tables.knowledge).select('*');
    throwWithContext(error, 'Failed to fetch knowledge base articles');
    return data ?? [];
  },

  async fetchProfile(userId) {
    const { data, error } = await supabase
      .from(tables.profiles)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    throwWithContext(error, 'Failed to fetch profile');
    return data ?? null;
  },

  async createProfile(payload) {
    const { data, error } = await supabase.from(tables.profiles).insert(payload).select().single();
    throwWithContext(error, 'Failed to create profile');
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from(tables.profiles)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    throwWithContext(error, 'Failed to update profile');
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
    const { error } = await supabase.from(tables.feedback).insert(payload);
    throwWithContext(error, 'Failed to submit diagnosis feedback');
  },

  async uploadToBucket({ bucket, path, body, contentType = 'application/octet-stream' }) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to upload.');
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, body, {
      cacheControl: '3600',
      upsert: true,
      contentType
    });

    throwWithContext(error, `Failed to upload to bucket ${bucket}`);
    return data?.path ?? path;
  },

  async createSignedUrls(paths, { bucket = buckets.diagnosis, expiresIn = 600 } = {}) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to sign URLs.');
    }

    if (!paths || paths.length === 0) {
      return [];
    }

    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);
    throwWithContext(error, `Failed to create signed URLs for bucket ${bucket}`);

    return (data ?? []).map((item) => item.signedUrl);
  },

  async createSignedUrl(path, { bucket = buckets.profile, expiresIn = 600 } = {}) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to sign URL.');
    }

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    throwWithContext(error, `Failed to create signed URL for bucket ${bucket}`);

    return data?.signedUrl ?? '';
  },

  async removeFromBucket(paths, bucket = buckets.diagnosis) {
    if (!bucket) {
      throw new Error('Storage bucket name is required to remove files.');
    }

    if (!paths || paths.length === 0) {
      return;
    }

    const { error } = await supabase.storage.from(bucket).remove(paths);
    throwWithContext(error, `Failed to remove files from bucket ${bucket}`);
  },

  async invokeEdgeFunction(name, body, headers) {
    if (!name) {
      throw new Error('Function name is required to invoke a Supabase Edge Function.');
    }

    const { data, error } = await supabase.functions.invoke(name, {
      body,
      headers: { 'Content-Type': 'application/json', ...(headers ?? {}) }
    });

    throwWithContext(error, `Failed to invoke edge function ${name}`);
    return data;
  },

  defaultBuckets: buckets,
  defaultFunctions: config.supabase.functions
};
