import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Single source of truth for configuration.
 * The app fails fast at startup if a required variable is missing,
 * instead of failing later with a confusing runtime error.
 */
const REQUIRED_VARS = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

const missing = REQUIRED_VARS.filter((key) => process.env[key] === undefined || process.env[key] === '');
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in the values.',
  );
}

/** Reads an integer env var, falling back to `fallback`; throws if it's not a valid number. */
const intFromEnv = (name, fallback, { min = 0 } = {}) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`Environment variable ${name} must be an integer >= ${min} (got "${raw}")`);
  }
  return value;
};

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: intFromEnv('PORT', 5000, { min: 1 }),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  db: Object.freeze({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }),

  auth: Object.freeze({
    jwtSecret: process.env.JWT_SECRET,
    // Short-lived: limits how long a stolen access token is useful.
    accessTokenTtlMinutes: intFromEnv('ACCESS_TOKEN_TTL_MINUTES', 15, { min: 1 }),
    // Long-lived: how long a user stays logged in without typing their password.
    refreshTokenTtlDays: intFromEnv('REFRESH_TOKEN_TTL_DAYS', 7, { min: 1 }),
    // Two browser tabs may refresh at the same moment with the same token. A rotated token
    // reused within this window is treated as that harmless race, not as theft.
    refreshReuseGraceSeconds: intFromEnv('REFRESH_REUSE_GRACE_SECONDS', 5, { min: 0 }),
    bcryptSaltRounds: intFromEnv('BCRYPT_SALT_ROUNDS', 10, { min: 4 }),
  }),
});

export default env;
