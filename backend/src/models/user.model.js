import pool from '../config/db.js';

// Columns that are safe to return to clients; password_hash is never included.
const PUBLIC_COLUMNS = 'id, name, email, created_at';

// Every function takes an optional `db`: the shared pool by default, or a transaction
// client (from withTransaction) when the query has to be part of a transaction.

/**
 * Includes password_hash: for credential checks inside the auth service ONLY.
 */
export const findByEmailWithPassword = async (email, db = pool) => {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
};

export const findById = async (id, db = pool) => {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

export const create = async ({ name, email, passwordHash }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash],
  );
  return rows[0];
};
