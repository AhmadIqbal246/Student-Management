/**
 * PostgreSQL SQLSTATE codes the app reacts to.
 * Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_ERROR = Object.freeze({
  UNIQUE_VIOLATION: '23505',
  CHECK_VIOLATION: '23514',
  NOT_NULL_VIOLATION: '23502',
  STRING_TOO_LONG: '22001',
  INVALID_TEXT_REPRESENTATION: '22P02',
  NUMERIC_OUT_OF_RANGE: '22003',
});

export const isUniqueViolation = (err) => err?.code === PG_ERROR.UNIQUE_VIOLATION;
