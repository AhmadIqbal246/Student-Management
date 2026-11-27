import { matchedData } from 'express-validator';
import * as studentService from '../services/student.service.js';
import { sendSuccess } from '../utils/response.js';

const getBody = (req) => {
  const { name, email, age } = matchedData(req, { locations: ['body'] });
  return { name, email, age };
};

const getId = (req) => matchedData(req, { locations: ['params'] }).id;

export const createStudent = async (req, res) => {
  const student = await studentService.createStudent(getBody(req));
  res.location(`${req.baseUrl}/${student.id}`);
  sendSuccess(res, { statusCode: 201, message: 'Student created successfully', data: { student } });
};

export const getAllStudents = async (_req, res) => {
  const students = await studentService.getAllStudents();
  sendSuccess(res, { data: { count: students.length, students } });
};

export const getStudentById = async (req, res) => {
  const student = await studentService.getStudentById(getId(req));
  sendSuccess(res, { data: { student } });
};

export const updateStudent = async (req, res) => {
  const student = await studentService.updateStudent(getId(req), getBody(req));
  sendSuccess(res, { message: 'Student updated successfully', data: { student } });
};

export const deleteStudent = async (req, res) => {
  const id = getId(req);
  await studentService.deleteStudent(id);
  sendSuccess(res, { message: `Student with id ${id} deleted successfully` });
};
