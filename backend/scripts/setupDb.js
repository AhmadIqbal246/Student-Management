/**
 * Creates the database (if missing) and its tables from database/schema.sql,
 * without needing the psql CLI installed.
 *
 * Usage: npm run db:setup
 */
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import env from '../src/config/env.js';

const SCHEMA_PATH = new URL('../database/schema.sql', import.meta.url);
const TABLES_MARKER = '-- @tables';

const run = async () => {
  const { database, ...connection } = env.db;

  // 1. Connect to the default "postgres" database to create ours if needed.
  const admin = new pg.Client({ ...connection, database: 'postgres' });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (rowCount === 0) {
      // A database name can't be a $1 parameter, so quote it as an identifier instead.
      await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
      console.log(`Created database "${database}"`);
    } else {
      console.log(`Database "${database}" already exists`);
    }
  } finally {
    await admin.end();
  }

  // 2. Run the plain-SQL part of schema.sql (everything after the psql-only header).
  const schema = await readFile(SCHEMA_PATH, 'utf8');
  const markerIndex = schema.indexOf(TABLES_MARKER);
  if (markerIndex === -1) throw new Error(`"${TABLES_MARKER}" marker not found in schema.sql`);

  const client = new pg.Client(env.db);
  await client.connect();
  try {
    await client.query(schema.slice(markerIndex));
    const { rows } = await client.query(
      "SELECT string_agg(tablename, ', ' ORDER BY tablename) AS tables FROM pg_tables WHERE schemaname = 'public'",
    );
    console.log(`Tables are ready: ${rows[0].tables}`);
  } finally {
    await client.end();
  }
};

run().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
