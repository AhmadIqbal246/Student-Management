import { Router } from 'express';
import * as studentController from '../controllers/student.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createStudentRules,
  idRules,
  updateStudentRules,
} from '../validators/student.validator.js';

const router = Router();

// Every student route requires a logged-in user.
router.use(authenticate);

router
  .route('/')
  .post(validate(createStudentRules), studentController.createStudent)
  .get(studentController.getAllStudents);

router
  .route('/:id')
  .get(validate(idRules), studentController.getStudentById)
  .put(validate(updateStudentRules), studentController.updateStudent)
  .delete(validate(idRules), studentController.deleteStudent);

export default router;
