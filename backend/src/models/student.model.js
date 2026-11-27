import { query } from '../config/db.js';

const COLUMNS = 'id, name, email, age, created_at';

export const findAll = async () => {
  const { rows } = await query(`SELECT ${COLUMNS} FROM students ORDER BY created_at DESC, id DESC`);
  return rows;
};

export const findById = async (id) => {
  const { rows } = await query(`SELECT ${COLUMNS} FROM students WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

export const create = async ({ name, email, age }) => {
  const { rows } = await query(
    `INSERT INTO students (name, email, age)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [name, email, age],
  );
  return rows[0];
};

/**
 * @returns the updated row, or null if no student has that id
 */
export const update = async (id, { name, email, age }) => {
  const { rows } = await query(
    `UPDATE students
     SET name = $1, email = $2, age = $3
     WHERE id = $4
     RETURNING ${COLUMNS}`,
    [name, email, age, id],
  );
  return rows[0] ?? null;
};

/**
 * @returns true if a row was deleted, false if no student has that id
 */
export const remove = async (id) => {
  const { rowCount } = await query('DELETE FROM students WHERE id = $1', [id]);
  return rowCount > 0;
};
