import { authService } from '../services/authService.js';

const mapSessionResponse = (data) => ({
  user: data.user,
  accessToken: data.session?.access_token,
  refreshToken: data.session?.refresh_token,
  expiresAt: data.session?.expires_at
});

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const data = await authService.signIn(email, password);
    return res.json(mapSessionResponse(data));
  } catch (error) {
    next(error);
  }
};

export const signUp = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
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
