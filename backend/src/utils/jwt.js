import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Issue a short-lived access token. The user id goes in the standard `sub` claim.
 * @param {{ id: number, email: string }} user
 */
export const signAccessToken = (user) =>
  jwt.sign({ email: user.email }, env.auth.jwtSecret, {
    subject: String(user.id),
    expiresIn: `${env.auth.accessTokenTtlMinutes}m`,
    algorithm: 'HS256',
  });

/**
 * Verify an access token and return its payload. Throws if it's invalid or expired.
 * The algorithm is pinned so a token signed with another algorithm is rejected.
 */
export const verifyAccessToken = (token) =>
  jwt.verify(token, env.auth.jwtSecret, { algorithms: ['HS256'] });
