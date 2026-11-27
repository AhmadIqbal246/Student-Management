import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Runs the given express-validator chains, then either continues or responds 400
 * with one message per invalid field.
 *
 * Usage: router.post('/', validate(createStudentRules), controller.create)
 */
export const validate = (rules) => [
  ...rules,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result
      .array({ onlyFirstError: true })
      .map((err) => ({ field: err.path, message: err.msg }));

    return next(ApiError.badRequest('Validation failed', errors));
  },
];
