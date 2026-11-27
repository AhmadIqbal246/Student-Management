-- =============================================================================
-- Student Management System: database and table creation
--
-- Option A (psql):   psql -U postgres -f database/schema.sql
-- Option B (Node):   npm run db:setup     (uses the DB_* values from .env)
-- Option C (pgAdmin): create the database by hand, then run everything below
--                     the "@tables" marker in the Query Tool.
-- =============================================================================

-- Create the database only if it doesn't exist (\gexec is a psql meta-command).
SELECT 'CREATE DATABASE student_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'student_management')\gexec

\connect student_management

-- @tables ---------------------------------------------------------------------
-- Everything below is plain SQL and safe to run more than once.

-- Application users (people who log in to manage students)
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,              -- bcrypt hash, never the plain password
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Students managed through the CRUD API
CREATE TABLE IF NOT EXISTS students (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    age        SMALLINT     NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_students_email UNIQUE (email),
    CONSTRAINT chk_students_age CHECK (age BETWEEN 1 AND 120),
    CONSTRAINT chk_students_name_not_blank CHECK (length(trim(name)) > 0)
);

-- Supports the default "newest first" listing.
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students (created_at DESC);

-- Refresh tokens: one row per login session. Only a SHA-256 hash of the token is
-- stored, so a leaked database can't be used to take over sessions.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash     CHAR(64)    NOT NULL,              -- SHA-256 hex of the raw token
    expires_at     TIMESTAMPTZ NOT NULL,
    revoked_at     TIMESTAMPTZ,                       -- NULL = still usable
    revoked_reason VARCHAR(20),                       -- why it stopped being usable
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT chk_refresh_tokens_revoked_reason
        CHECK (revoked_reason IN ('rotated', 'logout', 'reuse_detected')),
    CONSTRAINT chk_refresh_tokens_revoked_pair
        CHECK ((revoked_at IS NULL) = (revoked_reason IS NULL))
);

-- Used when revoking all of a user's sessions and cleaning up their expired tokens.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
