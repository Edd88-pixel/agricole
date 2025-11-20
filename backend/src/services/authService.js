import { getSupabaseClient } from './supabaseClient.js';

const supabase = () => getSupabaseClient();

const mapAuthError = (error) => {
  if (!error) return null;
  const mapped = new Error(error.message || 'Authentication failed');
  mapped.status = typeof error.status === 'number' ? error.status : 400;
  return mapped;
};

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password });
    const mapped = mapAuthError(error);
    if (mapped) throw mapped;
    return data;
  },

  async signUp({ email, password, firstName, lastName }) {
    const { data, error } = await supabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName?.trim() || undefined,
          last_name: lastName?.trim() || undefined,
          full_name: [firstName, lastName]
            .map((value) => value?.trim())
            .filter(Boolean)
            .join(' ') || undefined
        }
      }
    });
    const mapped = mapAuthError(error);
    if (mapped) throw mapped;
    return data;
  },

  async getUserFromToken(token) {
    const { data, error } = await supabase().auth.getUser(token);
    const mapped = mapAuthError(error);
    if (mapped) throw mapped;
    return data.user;
  },

  async signOut(refreshToken) {
    if (!refreshToken) return;
    await supabase().auth.admin.signOut(refreshToken);
  }
};
