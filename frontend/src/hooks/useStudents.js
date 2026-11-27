import { useCallback, useEffect, useState } from 'react'
import * as studentApi from '../api/student.api'
import { getErrorMessage } from '../utils/apiErrors'

const LOAD_ERROR = 'Failed to load students'

/**
 * Holds the student list and keeps it in sync after each create/update/delete.
 * Mutations re-throw errors so the calling form can show field-level messages.
 */
export function useStudents() {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Initial load. `ignore` stops a late response from updating state after unmount
  // (or after React StrictMode's double-invoke in development).
  useEffect(() => {
    let ignore = false
    studentApi
      .getStudents()
      .then((data) => !ignore && setStudents(data))
      .catch((error) => !ignore && setLoadError(getErrorMessage(error, LOAD_ERROR)))
      .finally(() => !ignore && setIsLoading(false))
    return () => {
      ignore = true
    }
  }, [])

  // Manual refresh, triggered by the Refresh button.
  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      setStudents(await studentApi.getStudents())
    } catch (error) {
      setLoadError(getErrorMessage(error, LOAD_ERROR))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createStudent = useCallback(async (data) => {
    const created = await studentApi.createStudent(data)
    setStudents((prev) => [created, ...prev])
    return created
  }, [])

  const updateStudent = useCallback(async (id, data) => {
    const updated = await studentApi.updateStudent(id, data)
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)))
    return updated
  }, [])

  const deleteStudent = useCallback(async (id) => {
    await studentApi.deleteStudent(id)
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { students, isLoading, loadError, reload, createStudent, updateStudent, deleteStudent }
}
