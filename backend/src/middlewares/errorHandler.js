export const notFoundHandler = (_req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // eslint-disable-next-line no-console
  console.error(`[Error] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    error: message,
  });
};
