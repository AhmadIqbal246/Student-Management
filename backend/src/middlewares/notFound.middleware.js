import ApiError from '../utils/ApiError.js';

/** Catch-all for unknown routes; must be registered after all routers. */
export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
