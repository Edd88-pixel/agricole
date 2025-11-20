import { authService } from '../services/authService.js';
import { buildHttpError, toNonEmptyString } from '../utils/validation.js';

const isEmailValid = (email) => /.+@.+\..+/.test(email);

const mapSessionResponse = (data) => ({
  user: data.user,
  accessToken: data.session?.access_token,
  refreshToken: data.session?.refresh_token,
  expiresAt: data.session?.expires_at
});

export const signIn = async (req, res, next) => {
  try {
    const email = toNonEmptyString(req.body?.email);
    const password = toNonEmptyString(req.body?.password);
    if (!email || !password || !isEmailValid(email)) {
      throw buildHttpError('Valid email and password are required.', 400);
    }

    const data = await authService.signIn(email, password);
    return res.json(mapSessionResponse(data));
  } catch (error) {
    next(error);
  }
};

export const signUp = async (req, res, next) => {
  try {
    const email = toNonEmptyString(req.body?.email);
    const password = toNonEmptyString(req.body?.password);
    const firstName = toNonEmptyString(req.body?.firstName);
    const lastName = toNonEmptyString(req.body?.lastName);
    if (!email || !password || !isEmailValid(email)) {
      throw buildHttpError('Valid email and password are required.', 400);
    }

    const data = await authService.signUp({ email, password, firstName, lastName });
    return res.json(mapSessionResponse(data));
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({ user: req.user });
};

export const signOut = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    await authService.signOut(refreshToken);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
