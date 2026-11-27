import { body, param } from 'express-validator';
import { requiredEmail, requiredString } from './common.js';

const idParam = param('id')
  .isInt({ min: 1, max: 2_147_483_647, allow_leading_zeroes: false }) // PostgreSQL INTEGER range
  .withMessage('Student id must be a positive integer')
  .toInt();

const studentBody = [
  requiredString('name', 'Name', { min: 2, max: 100 }),
  requiredEmail(),
  body('age')
    .exists({ values: 'null' }).withMessage('Age is required')
    .bail()
    // isInt accepts 20 or "20" but rejects 20.5, "abc", true and [] (booleans and arrays fail).
    .isInt({ min: 1, max: 120, allow_leading_zeroes: false })
    .withMessage('Age must be a whole number between 1 and 120')
    .toInt(),
];

export const idRules = [idParam];
export const createStudentRules = studentBody;
// PUT replaces the whole resource, so every field is required.
export const updateStudentRules = [idParam, ...studentBody];
