import * as studentModel from '../models/student.model.js';
import ApiError from '../utils/ApiError.js';
import { isUniqueViolation } from '../utils/dbErrors.js';

const EMAIL_TAKEN = 'A student with this email already exists';

const notFound = (id) => ApiError.notFound(`Student with id ${id} not found`);

/** Converts a duplicate-email DB error into a 409; re-throws anything else. */
const rethrowAsConflict = (err) => {
  if (isUniqueViolation(err)) throw ApiError.conflict(EMAIL_TAKEN);
  throw err;
};

export const getAllStudents = () => studentModel.findAll();

export const getStudentById = async (id) => {
  const student = await studentModel.findById(id);
  if (!student) throw notFound(id);
  return student;
};

export const createStudent = async (data) => {
  try {
    return await studentModel.create(data);
  } catch (err) {
    return rethrowAsConflict(err);
  }
};

export const updateStudent = async (id, data) => {
  let student;
  try {
    student = await studentModel.update(id, data);
  } catch (err) {
    rethrowAsConflict(err);
  }
  if (!student) throw notFound(id);
  return student;
};

export const deleteStudent = async (id) => {
  const deleted = await studentModel.remove(id);
  if (!deleted) throw notFound(id);
};
