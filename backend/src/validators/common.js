import { body } from 'express-validator';

/**
 * A required, trimmed string field. Checks run in order so the client gets the most
 * useful message first: missing → wrong type → blank → too short/long.
 */
export const requiredString = (field, label, { min = 1, max = 255 } = {}) =>
  body(field)
    .exists({ values: 'null' }).withMessage(`${label} is required`)
    .bail()
    .isString().withMessage(`${label} must be a string`)
    .bail()
    .trim()
    .notEmpty().withMessage(`${label} is required`)
    .bail()
    .isLength({ min, max }).withMessage(`${label} must be between ${min} and ${max} characters`);

/** A required email, stored lowercase so "A@x.com" and "a@x.com" count as the same address. */
export const requiredEmail = (field = 'email') =>
  requiredString(field, 'Email', { max: 255 })
    .bail()
    .isEmail().withMessage('Email must be a valid email address')
    .toLowerCase();
