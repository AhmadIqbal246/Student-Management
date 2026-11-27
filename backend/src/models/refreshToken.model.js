import pool from '../config/db.js';

/** Values allowed in refresh_tokens.revoked_reason (see the CHECK constraint in schema.sql). */
export const REVOKED_REASON = Object.freeze({
  ROTATED: 'rotated', // exchanged for a new token by /auth/refresh
  LOGOUT: 'logout', // the user logged out
  REUSE_DETECTED: 'reuse_detected', // revoked because a stolen token was detected
});

export const create = async ({ userId, tokenHash, expiresAt }, db = pool) => {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
};

/**
 * Marks an active (not revoked, not expired) token as used, in ONE statement.
 * If two requests send the same token at the same moment, PostgreSQL's row lock makes
 * sure only one of them gets a row back. The other gets null.
 *
 * @returns {{ user_id: number } | null}
 */
export const consume = async (tokenHash, db = pool) => {
  const { rows } = await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), revoked_reason = $2
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash, REVOKED_REASON.ROTATED],
  );
  return rows[0] ?? null;
};

/**
 * Looks up a token regardless of its state. Used to work out WHY consume() failed.
 * Time comparisons run in SQL so they use the database clock, the same one that set the values.
 */
export const findByHash = async (tokenHash, db = pool) => {
  const { rows } = await db.query(
    `SELECT user_id,
            revoked_reason,
            expires_at <= NOW()                         AS is_expired,
            EXTRACT(EPOCH FROM (NOW() - revoked_at))::float AS seconds_since_revoked
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash],
  );
  return rows[0] ?? null;
};

/** Revokes one token (logout). Does nothing if it's unknown or already revoked. */
export const revoke = async (tokenHash, reason, db = pool) => {
  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), revoked_reason = $2
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash, reason],
  );
};

/** Revokes every active session of a user (e.g. after token theft is detected). */
export const revokeAllForUser = async (userId, reason, db = pool) => {
  const { rowCount } = await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), revoked_reason = $2
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason],
  );
  return rowCount;
};

/**
 * Deletes a user's expired tokens so the table doesn't grow forever.
 * Revoked-but-unexpired rows are kept on purpose: reuse detection needs them.
 */
export const deleteExpiredForUser = async (userId, db = pool) => {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at <= NOW()', [userId]);
};
