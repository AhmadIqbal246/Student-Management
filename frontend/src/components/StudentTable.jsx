const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function StudentTable({ students, editingId, deletingId, onEdit, onDelete }) {
  if (students.length === 0) {
    return <p className="empty-state">No students yet. Add your first student above.</p>
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Age</th>
            <th scope="col">Created at</th>
            <th scope="col" className="col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className={student.id === editingId ? 'row-active' : undefined}>
              <td>{student.id}</td>
              <td>{student.name}</td>
              <td>{student.email}</td>
              <td>{student.age}</td>
              <td>{dateFormatter.format(new Date(student.created_at))}</td>
              <td className="col-actions">
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => onEdit(student)}
                  disabled={deletingId === student.id}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => onDelete(student)}
                  disabled={deletingId === student.id}
                >
                  {deletingId === student.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
