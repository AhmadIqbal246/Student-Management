import * as userModel from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { ACCESS_TOKEN_COOKIE } from '../utils/authCookies.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Protects a route: requires a valid access token in the httpOnly `access_token` cookie.
 * On success it sets req.user = { id, name, email, created_at }.
 *
 * Every failure is a 401, which tells the frontend to call POST /api/auth/refresh and retry.
 */
export const authenticate = async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Access token has expired' : 'Invalid access token';
    throw ApiError.unauthorized(message);
  }

  // Reject tokens for accounts that no longer exist.
  const user = await userModel.findById(Number(payload.sub));
  if (!user) throw ApiError.unauthorized('User for this token no longer exists');

  req.user = user;
  next();
};
