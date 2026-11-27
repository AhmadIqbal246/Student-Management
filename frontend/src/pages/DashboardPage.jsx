import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Loader from '../components/Loader'
import StudentForm from '../components/StudentForm'
import StudentTable from '../components/StudentTable'
import { useStudents } from '../hooks/useStudents'
import { getErrorMessage } from '../utils/apiErrors'

const SUCCESS_TIMEOUT_MS = 4000

export default function DashboardPage() {
  const { students, isLoading, loadError, reload, createStudent, updateStudent, deleteStudent } =
    useStudents()

  const [editingStudent, setEditingStudent] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')

  // Hide success messages automatically after a few seconds.
  useEffect(() => {
    if (!successMessage) return undefined
    const timer = setTimeout(() => setSuccessMessage(''), SUCCESS_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [successMessage])

  const showSuccess = (message) => {
    setActionError('')
    setSuccessMessage(message)
  }

  // Errors are re-thrown so StudentForm can show them next to the fields.
  const handleSubmit = async (data) => {
    if (editingStudent) {
      const updated = await updateStudent(editingStudent.id, data)
      setEditingStudent(null)
      showSuccess(`Updated "${updated.name}"`)
    } else {
      const created = await createStudent(data)
      showSuccess(`Added "${created.name}"`)
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete "${student.name}"? This cannot be undone.`)) return

    setDeletingId(student.id)
    setActionError('')
    try {
      await deleteStudent(student.id)
      if (editingStudent?.id === student.id) setEditingStudent(null)
      showSuccess(`Deleted "${student.name}"`)
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to delete student'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Students</h1>
        <p className="muted">Add, edit and remove students.</p>
      </div>

      <Alert type="success" onClose={() => setSuccessMessage('')}>
        {successMessage}
      </Alert>
      <Alert type="error" onClose={() => setActionError('')}>
        {actionError}
      </Alert>

      <StudentForm
        key={editingStudent?.id ?? 'new'}
        student={editingStudent}
        onSubmit={handleSubmit}
        onCancel={() => setEditingStudent(null)}
      />

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">
            All students {!isLoading && !loadError && <span className="badge">{students.length}</span>}
          </h2>
          <button type="button" className="btn btn-secondary btn-small" onClick={reload} disabled={isLoading}>
            Refresh
          </button>
        </div>

        {isLoading && <Loader label="Loading students..." />}
        {!isLoading && loadError && <Alert type="error">{loadError}</Alert>}
        {!isLoading && !loadError && (
          <StudentTable
            students={students}
            editingId={editingStudent?.id}
            deletingId={deletingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>
    </>
  )
}
