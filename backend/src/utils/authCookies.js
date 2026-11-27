import env from '../config/env.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const baseOptions = {
  httpOnly: true, // JavaScript in the browser can't read it, so an XSS attack can't steal it
  secure: env.isProduction, // HTTPS-only in production (localhost uses plain HTTP)
  sameSite: 'strict', // never sent with requests started by other websites, which blocks CSRF
};

const accessCookie = {
  ...baseOptions,
  path: '/api', // sent with every API request
  maxAge: env.auth.accessTokenTtlMinutes * 60 * 1000,
};

const refreshCookie = {
  ...baseOptions,
  path: '/api/auth', // only sent to the auth routes (refresh/logout), not with every request
  maxAge: env.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookie);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookie);
};

/** To clear a cookie, the browser needs the same path/flags it was set with. */
export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseOptions, path: accessCookie.path });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseOptions, path: refreshCookie.path });
};
