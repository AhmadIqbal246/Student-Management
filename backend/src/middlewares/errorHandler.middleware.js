import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { PG_ERROR } from '../utils/dbErrors.js';

// DB errors that mean "the client sent bad data", used as a safety net when a value
// gets past validation but breaks a constraint.
const PG_CLIENT_ERRORS = {
  [PG_ERROR.UNIQUE_VIOLATION]: [409, 'A record with this value already exists'],
  [PG_ERROR.CHECK_VIOLATION]: [400, 'A value is outside the allowed range'],
  [PG_ERROR.NOT_NULL_VIOLATION]: [400, 'A required value is missing'],
  [PG_ERROR.STRING_TOO_LONG]: [400, 'A value is too long'],
  [PG_ERROR.INVALID_TEXT_REPRESENTATION]: [400, 'A value has an invalid format'],
  [PG_ERROR.NUMERIC_OUT_OF_RANGE]: [400, 'A numeric value is out of range'],
};

/**
 * Central error handler: every error thrown or passed to next() ends up here.
 * Express recognises it as an error handler because it takes 4 arguments.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors;

  if (err instanceof ApiError) {
    ({ statusCode, message, errors } = err);
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  } else if (err.code && PG_CLIENT_ERRORS[err.code]) {
    [statusCode, message] = PG_CLIENT_ERRORS[err.code];
  } else if (Number.isInteger(err.status) && err.status < 500 && err.expose) {
    // Other http-errors from Express/body-parser that are marked safe to expose.
    statusCode = err.status;
    message = err.message;
  }

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Stack traces help while developing but must never leak in production.
    ...(!env.isProduction && statusCode >= 500 && { stack: err.stack }),
  });
};
