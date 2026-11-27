import api from './axios'

export const getStudents = async () => {
  const { data } = await api.get('/students')
  return data.data.students
}

export const getStudent = async (id) => {
  const { data } = await api.get(`/students/${id}`)
  return data.data.student
}

export const createStudent = async (student) => {
  const { data } = await api.post('/students', student)
  return data.data.student
}

export const updateStudent = async (id, student) => {
  const { data } = await api.put(`/students/${id}`, student)
  return data.data.student
}

export const deleteStudent = async (id) => {
  await api.delete(`/students/${id}`)
}
