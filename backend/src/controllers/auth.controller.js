import { matchedData } from 'express-validator';
import * as authService from '../services/auth.service.js';
import { clearAuthCookies, REFRESH_TOKEN_COOKIE, setAuthCookies } from '../utils/authCookies.js';
import { sendSuccess } from '../utils/response.js';

// Controllers only handle HTTP: read the validated input, call a service, send the response.
// Tokens travel ONLY in httpOnly cookies and never in the JSON body, so the frontend's
// JavaScript never sees them.

export const signup = async (req, res) => {
  const { name, email, password } = matchedData(req, { locations: ['body'] });
  const { user, tokens } = await authService.signup({ name, email, password });
  setAuthCookies(res, tokens);
  sendSuccess(res, { statusCode: 201, message: 'Account created successfully', data: { user } });
};

export const login = async (req, res) => {
  const { email, password } = matchedData(req, { locations: ['body'] });
  const { user, tokens } = await authService.login({ email, password });
  setAuthCookies(res, tokens);
  sendSuccess(res, { message: 'Logged in successfully', data: { user } });
};

export const refresh = async (req, res) => {
  let result;
  try {
    result = await authService.refreshSession(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  } catch (err) {
    // The session is dead: remove the useless cookies, then let the error handler send the 401.
    clearAuthCookies(res);
    throw err;
  }

  if (result.status === 'already_rotated') {
    // Another tab refreshed with this same token a moment ago; the browser already has its new cookies.
    return sendSuccess(res, { message: 'Session was already refreshed' });
  }

  setAuthCookies(res, result.tokens);
  return sendSuccess(res, { message: 'Session refreshed', data: { user: result.user } });
};

export const getMe = async (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
};

/**
 * Doesn't need a valid access token: a user whose access token has expired must still be
 * able to log out. The refresh token is revoked in the database, so it can never be used again.
 */
export const logout = async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  clearAuthCookies(res);
  sendSuccess(res, { message: 'Logged out successfully' });
};
