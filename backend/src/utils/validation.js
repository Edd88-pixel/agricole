export const toNonEmptyString = (value) => (typeof value === 'string' ? value.trim() : '');

export const isNonEmptyString = (value) => toNonEmptyString(value).length > 0;

export const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toNonEmptyString(String(item))).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const ensureBoolean = (value) => (typeof value === 'boolean' ? value : null);

export const clampArray = (value, maxLength = 10) => value.slice(0, maxLength);

export const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const buildHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};
