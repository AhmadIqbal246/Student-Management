import { body } from 'express-validator';
import { requiredEmail, requiredString } from './common.js';

export const signupRules = [
  requiredString('name', 'Name', { min: 2, max: 100 }),
  requiredEmail(),
  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required')
    .bail()
    .isString().withMessage('Password must be a string')
    .bail()
    // bcrypt only uses the first 72 bytes of a password, so cap the length there.
    .isLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters')
    .bail()
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .bail()
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

export const loginRules = [
  requiredEmail(),
  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required')
    .bail()
    .isString().withMessage('Password must be a string'),
];
