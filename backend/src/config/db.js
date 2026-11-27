import pg from 'pg';
import env from './env.js';

const { Pool } = pg;
const pool = new Pool({
  ...env.db,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// An idle client can error (e.g. the DB restarts). Log it instead of crashing the process.
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Run a parameterized query. ALWAYS pass user input via `params`
 * ($1, $2, ...) and never concatenate it into `text`; that prevents SQL injection.
 * @param {string} text   SQL with $n placeholders
 * @param {unknown[]} [params]
 */
export const query = (text, params = []) => pool.query(text, params);

/**
 * Run several queries as ONE unit: either all of them are saved, or none are.
 * `work` receives a dedicated client; use it (not the pool) for every query inside.
 *
 *   await withTransaction(async (client) => {
 *     await client.query('UPDATE ...');
 *     await client.query('INSERT ...');
 *   });
 */
export const withTransaction = async (work) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const verifyConnection = async () => {
  await pool.query('SELECT 1');
};

export const closePool = () => pool.end();

export default pool;
