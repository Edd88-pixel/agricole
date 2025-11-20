import { authService } from '../services/authService.js';

const extractToken = (headerValue) => {
  if (!headerValue) return null;
  if (headerValue.startsWith('Bearer ')) {
    return headerValue.slice('Bearer '.length);
  }
  return headerValue;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.authToken = token;
    req.user = user;
    next();
  } catch (error) {
    const status = error.status || 401;
    res.status(status).json({ error: error.message || 'Unauthorized' });
  }
};
