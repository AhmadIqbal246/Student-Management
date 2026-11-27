import { createHash, randomBytes } from 'node:crypto';

/**
 * A refresh token is NOT a JWT: it's 32 random bytes (256 bits) that mean nothing on
 * their own. The database row decides whether it's valid, so it can be revoked at any time.
 */
export const generateRefreshToken = () => randomBytes(32).toString('base64url');

/**
 * Only the hash is stored in the database.
 * SHA-256 is enough here (bcrypt isn't needed): the token is fully random, so it can't be
 * guessed from a dictionary the way a human password can. Unlike bcrypt, SHA-256 always
 * gives the same output for the same input, so the row can be looked up by its hash.
 */
export const hashRefreshToken = (token) => createHash('sha256').update(token).digest('hex');
