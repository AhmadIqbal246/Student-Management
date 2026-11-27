import bcrypt from 'bcrypt';
import env from '../config/env.js';
import { withTransaction } from '../config/db.js';
import * as refreshTokenModel from '../models/refreshToken.model.js';
import { REVOKED_REASON } from '../models/refreshToken.model.js';
import * as userModel from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { isUniqueViolation } from '../utils/dbErrors.js';
import { signAccessToken } from '../utils/jwt.js';
import { generateRefreshToken, hashRefreshToken } from '../utils/refreshToken.js';

// Compared against when the email does not exist, so a login attempt takes about the same
// time whether or not the account exists. That stops attackers from finding valid emails by timing.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', env.auth.bcryptSaltRounds);

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_REFRESH = 'Session expired or invalid. Please log in again.';

const toPublicUser = ({ id, name, email, created_at }) => ({ id, name, email, created_at });

/**
 * Creates a new access token + refresh token pair for a user.
 * The refresh token is saved (as a hash) so it can be checked and revoked later.
 * @param db pass a transaction client when this must be part of a transaction
 */
const issueTokens = async (user, db) => {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await refreshTokenModel.create(
    { userId: user.id, tokenHash: hashRefreshToken(refreshToken), expiresAt },
    db,
  );

  return { accessToken: signAccessToken(user), refreshToken };
};

export const signup = async ({ name, email, password }) => {
  const passwordHash = await bcrypt.hash(password, env.auth.bcryptSaltRounds);

  try {
    // User + first session are created together: if either fails, neither is saved.
    return await withTransaction(async (client) => {
      const user = await userModel.create({ name, email, passwordHash }, client);
      const tokens = await issueTokens(user, client);
      return { user: toPublicUser(user), tokens };
    });
  } catch (err) {
    // The UNIQUE constraint is the source of truth: no race condition between "check" and "insert".
    if (isUniqueViolation(err)) {
      throw ApiError.conflict('An account with this email already exists');
    }
    throw err;
  }
};

export const login = async ({ email, password }) => {
  const user = await userModel.findByEmailWithPassword(email);
  const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    // Same message for both cases: don't reveal which emails are registered.
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  await refreshTokenModel.deleteExpiredForUser(user.id);
  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
};

/**
 * Exchanges a refresh token for a new token pair (rotation).
 *
 *  - Active token          → revoke it, issue a new pair.
 *  - Rotated a moment ago  → another tab refreshed with the same token at the same time.
 *                            Nothing is issued; that tab already has the new cookies.
 *  - Rotated earlier       → the token was copied and is being reused: theft.
 *                            Revoke ALL the user's sessions, so the attacker is logged out too.
 *  - Unknown/expired/other → 401.
 *
 * @returns {{ status: 'rotated', user, tokens } | { status: 'already_rotated' }}
 */
export const refreshSession = async (rawRefreshToken) => {
  if (!rawRefreshToken) throw ApiError.unauthorized('Refresh token is missing');

  const tokenHash = hashRefreshToken(rawRefreshToken);

  // Decisions are made inside the transaction and errors are thrown after it.
  // Throwing inside would ROLLBACK, which would undo the "revoke all sessions" step.
  const outcome = await withTransaction(async (client) => {
    const consumed = await refreshTokenModel.consume(tokenHash, client);

    if (consumed) {
      const user = await userModel.findById(consumed.user_id, client);
      if (!user) return { status: 'invalid' };
      const tokens = await issueTokens(user, client);
      return { status: 'rotated', user: toPublicUser(user), tokens };
    }

    const existing = await refreshTokenModel.findByHash(tokenHash, client);
    if (!existing || existing.is_expired || existing.revoked_reason !== REVOKED_REASON.ROTATED) {
      return { status: 'invalid' };
    }

    if (existing.seconds_since_revoked <= env.auth.refreshReuseGraceSeconds) {
      return { status: 'already_rotated' };
    }

    await refreshTokenModel.revokeAllForUser(existing.user_id, REVOKED_REASON.REUSE_DETECTED, client);
    return { status: 'reuse_detected' };
  });

  if (outcome.status === 'reuse_detected') {
    throw ApiError.unauthorized(
      'This session was already refreshed elsewhere. For your security, you have been logged out of all devices.',
    );
  }
  if (outcome.status === 'invalid') throw ApiError.unauthorized(INVALID_REFRESH);

  return outcome;
};

/** Revokes the session's refresh token. Safe to call with a missing or unknown token. */
export const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  await refreshTokenModel.revoke(hashRefreshToken(rawRefreshToken), REVOKED_REASON.LOGOUT);
};
