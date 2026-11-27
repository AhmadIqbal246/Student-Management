# Student Management System

A full-stack app for managing students. Users sign up and log in, then add, edit and delete student records.

| Layer    | Tech |
| -------- | ---- |
| Backend  | Node.js, Express 5, PostgreSQL via `pg` (raw parameterized SQL, no ORM) |
| Auth     | bcrypt password hashing, JWT access tokens + rotating refresh tokens in `httpOnly` cookies |
| Frontend | React 19 (Vite), React Router, Axios |

## Contents

1. [Prerequisites](#1-prerequisites)
2. [Setup](#2-setup)
3. [Running the app](#3-running-the-app)
4. [Testing the API with Postman](#4-testing-the-api-with-postman)
5. [Project structure](#5-project-structure)
6. [API reference](#6-api-reference)
7. [Authentication](#7-authentication)
8. [Environment variables](#8-environment-variables)
9. [Database schema](#9-database-schema)
10. [Design notes](#10-design-notes)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Check with |
| ---- | ------- | ---------- |
| [Node.js](https://nodejs.org/) | 20 or newer | `node -v` |
| npm | comes with Node.js | `npm -v` |
| [PostgreSQL](https://www.postgresql.org/download/) | 14 or newer, running locally | pgAdmin, or `psql --version` |
| [Postman](https://www.postman.com/downloads/) | any (only needed to test the API) | |

You also need the password of the PostgreSQL `postgres` superuser. You chose it when you installed PostgreSQL.

---

## 2. Setup

Every step below is needed only **once**. The commands work in PowerShell (Windows), Terminal (macOS) and Bash (Linux).

### Step 1: Get the code and install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Create the environment files

```bash
cd backend
cp .env.example .env

cd ../frontend
cp .env.example .env
```

The frontend `.env` works as is. In `backend/.env`, you still need to set the database credentials (step 3) and a JWT secret (step 4).

### Step 3: Create the database

Pick **one** option.

#### Option A: Use the `postgres` superuser (quickest)

In `backend/.env`, set the `postgres` password:

```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

Then create the database and tables:

```bash
cd backend
npm run db:setup
```

#### Option B: Create a dedicated app user (recommended)

The app logs in with a user that can only access its own database, not the whole PostgreSQL server.

**On Windows**, one script does everything. It asks for the `postgres` password, creates the `student_app` user with a random password, creates the database, writes the credentials into `backend/.env`, and creates the tables:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File scripts\create-db-user.ps1
```

**On any OS, by hand:**

1. Open pgAdmin's Query Tool (connected as `postgres`), or run `psql -U postgres`, and execute:
   ```sql
   CREATE ROLE student_app WITH LOGIN PASSWORD 'choose_a_strong_password';
   CREATE DATABASE student_management OWNER student_app;
   ```
2. In `backend/.env`, set:
   ```env
   DB_USER=student_app
   DB_PASSWORD=choose_a_strong_password
   ```
3. Create the tables:
   ```bash
   cd backend
   npm run db:setup
   ```

**Expected output** of `npm run db:setup` (for any option):

```
Database "student_management" already exists     ← or: Created database "student_management"
Tables are ready: refresh_tokens, students, users
```

<details>
<summary>Other ways to run <code>schema.sql</code></summary>

- **psql:** `psql -h localhost -U student_app -d postgres -f database/schema.sql`
  (on Windows, if `psql` isn't on your PATH, use `& "C:\Program Files\PostgreSQL\18\bin\psql.exe"` instead of `psql`)
- **pgAdmin:** open the Query Tool on the `student_management` database and run everything **below** the `-- @tables` line. The lines above it (`\gexec`, `\connect`) only work in psql.

Run the script as the same user the app logs in with. Tables belong to whoever creates them, and the app gets `permission denied` on tables owned by another user.

</details>

### Step 4: Set the JWT secret

Generate a random secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output into `backend/.env`:

```env
JWT_SECRET=paste_the_generated_value_here
```

The Windows script in option B does **not** set this. Do this step in every case.

### Setup checklist

- [ ] `npm install` done in `backend/` and `frontend/`
- [ ] `backend/.env` has the correct `DB_USER` / `DB_PASSWORD` and a long random `JWT_SECRET`
- [ ] `npm run db:setup` printed `Tables are ready: refresh_tokens, students, users`

---

## 3. Running the app

Use **two terminals**: one for the backend, one for the frontend.

**Terminal 1: backend**

```bash
cd backend
npm run dev
```

```
Connected to PostgreSQL database "student_management"
Server running in development mode at http://localhost:5000/api
```

**Terminal 2: frontend**

```bash
cd frontend
npm run dev
```

```
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173**, click **Sign up**, create an account, and you'll land on the student dashboard. Press `Ctrl + C` in a terminal to stop that server.

### Available scripts

| Folder | Command | What it does |
| ------ | ------- | ------------ |
| `backend` | `npm run dev` | Starts the API and restarts it when a file changes (`node --watch`) |
| `backend` | `npm start` | Starts the API (`node src/server.js`) |
| `backend` | `npm run db:setup` | Creates the database (if allowed) and tables from `schema.sql` |
| `frontend` | `npm run dev` | Starts the React dev server on port 5173 |
| `frontend` | `npm run build` | Production build into `frontend/dist` |
| `frontend` | `npm run lint` | Lints the frontend code |

---

## 4. Testing the API with Postman

1. Start the backend (`npm run dev` in `backend/`).
2. In Postman, click **Import** and select `backend/postman/Student-Management-API.postman_collection.json`.
3. Right-click the collection and choose **Run collection**, then **Run**.

The requests run top to bottom. Each one has test scripts that check its status code and response. They cover:

- **Auth:** signup, login and `me`, plus 400 / 401 / 409 error cases
- **Students:** full CRUD, plus 400 / 401 / 404 / 409 error cases
- **Session:** refresh, token rotation, and theft detection (reusing an old refresh token)
- **Logout:** cookies cleared, and access is refused afterwards

Authentication uses cookies, and Postman's cookie jar stores and sends them automatically, so there's no token to copy. Unique emails are generated on each run, so the collection can be run again and again. One request waits 6 seconds on purpose; it has to get past the refresh-token grace period.

---

## 5. Project structure

```
.
├── backend/
│   ├── database/schema.sql            # database + tables (users, students, refresh_tokens)
│   ├── postman/                       # Postman collection with test scripts
│   ├── scripts/
│   │   ├── setupDb.js                 # npm run db:setup: runs schema.sql without psql
│   │   └── create-db-user.ps1         # Windows: creates the app DB user + database + .env
│   ├── src/
│   │   ├── config/                    # env.js (loads + validates .env), db.js (pool, transactions)
│   │   ├── routes/                    # URL + HTTP method → middleware → controller
│   │   ├── middlewares/               # auth (JWT cookie), validation, rate limit, 404, error handler
│   │   ├── validators/                # express-validator rules for request bodies and params
│   │   ├── controllers/               # HTTP only: read the request, set cookies, send JSON
│   │   ├── services/                  # business logic: bcrypt, tokens, rotation, 404/409 rules
│   │   ├── models/                    # SQL queries only ($1, $2 placeholders)
│   │   ├── utils/                     # ApiError, JWT, refresh token, cookies, pg error codes
│   │   ├── app.js                     # Express app (no listen, so it can be tested)
│   │   └── server.js                  # checks the DB, listens, graceful shutdown
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/                       # axios instance (cookies + silent refresh), API calls
    │   ├── context/                   # AuthContext + AuthProvider (who is logged in)
    │   ├── hooks/                     # useAuth, useForm, useStudents
    │   ├── components/                # ProtectedRoute, PublicOnlyRoute, Navbar, StudentForm, StudentTable…
    │   ├── pages/                     # Login, Signup, Dashboard, NotFound
    │   ├── utils/                     # form validation, API error parsing
    │   └── App.jsx                    # route definitions
    └── .env.example
```

### How a request flows through the backend

```
route → authenticate → validate → controller → service → model (SQL) → PostgreSQL
```

| Layer | Responsibility | Example |
| ----- | -------------- | ------- |
| Route | Which code runs for which URL, and which checks run first | `student.routes.js` |
| Middleware | Is the user logged in? Is the input valid? | `auth.middleware.js`, `validate.middleware.js` |
| Controller | Reads the request, sends the response | `student.controller.js` |
| Service | Business rules (404 if missing, 409 if duplicate) | `student.service.js` |
| Model | Raw SQL with `$1, $2` placeholders | `student.model.js` |

Any thrown error goes to the central `errorHandler`, which turns it into the right HTTP status and a consistent JSON response.

---

## 6. API reference

Base URL: `http://localhost:5000/api`. 🔒 = needs a valid `access_token` cookie (set by login/signup).

| Method | Endpoint | Description | Success | Errors |
| ------ | -------- | ----------- | ------- | ------ |
| GET | `/health` | Health check | 200 | |
| POST | `/auth/signup` | Register; sets auth cookies | 201 | 400, 409, 429 |
| POST | `/auth/login` | Log in; sets auth cookies | 200 | 400, 401, 429 |
| POST | `/auth/refresh` | Exchanges the `refresh_token` cookie for a new pair | 200 | 401 |
| POST | `/auth/logout` | Revokes the refresh token, clears cookies | 200 | |
| GET | `/auth/me` 🔒 | Current user | 200 | 401 |
| POST | `/students` 🔒 | Create a student | 201 | 400, 401, 409 |
| GET | `/students` 🔒 | List all students | 200 | 401 |
| GET | `/students/:id` 🔒 | Get one student | 200 | 400, 401, 404 |
| PUT | `/students/:id` 🔒 | Replace a student (all fields required) | 200 | 400, 401, 404, 409 |
| DELETE | `/students/:id` 🔒 | Delete a student | 200 | 400, 401, 404 |

### Request bodies

```jsonc
// POST /auth/signup
{ "name": "Ali Khan", "email": "ali@example.com", "password": "Password123" }

// POST /auth/login
{ "email": "ali@example.com", "password": "Password123" }

// POST /students   and   PUT /students/:id
{ "name": "Sara Ahmed", "email": "sara@example.com", "age": 21 }
```

### Validation rules

| Field | Rule |
| ----- | ---- |
| `name` | Required, 2–100 characters |
| `email` | Required, valid email, max 255 characters, stored lowercase, must be unique |
| `password` | 8–72 characters, at least one letter and one number |
| `age` | Whole number from 1 to 120 |
| `:id` | Positive integer |

### Response format

```jsonc
// success
{ "success": true, "message": "Student created successfully", "data": { "student": { ... } } }

// error
{ "success": false, "message": "Validation failed",
  "errors": [{ "field": "age", "message": "Age must be a whole number between 1 and 120" }] }
```

### Status codes

| Code | When |
| ---- | ---- |
| 200 / 201 | Success / resource created |
| 400 | Validation failed, invalid id, or malformed JSON |
| 401 | Not logged in, token expired or invalid, or wrong email/password |
| 404 | Student or route not found |
| 409 | Email already in use |
| 429 | Too many login/signup attempts (50 per 15 minutes) |
| 500 | Unexpected server error |

---

## 7. Authentication

| | Access token | Refresh token |
| --- | --- | --- |
| What | JWT signed with `JWT_SECRET` | 32 random bytes (not a JWT) |
| Lifetime | 15 minutes | 7 days |
| Stored in browser | `httpOnly` cookie, sent to `/api/*` | `httpOnly` cookie, sent only to `/api/auth/*` |
| Stored on server | Nothing (stateless) | SHA-256 hash in the `refresh_tokens` table |

1. **Signup/login:** the password is checked with bcrypt, and the server sets both cookies. Tokens never appear in the JSON response, so frontend JavaScript can't read them.
2. **Every request:** the browser sends `access_token` automatically, and `auth.middleware.js` verifies it.
3. **After 15 minutes** a request gets a 401. The axios interceptor calls `POST /auth/refresh` once and retries the original request, so the user doesn't notice.
4. **Rotation:** each refresh revokes the old refresh token and issues a new one, so a refresh token works only once.
5. **Theft detection:** if a token that was already rotated is used again, someone copied it. Every session of that user is revoked, which locks out the attacker too. Reuse within 5 seconds is treated as two browser tabs refreshing at the same moment and issues nothing.
6. **Logout** revokes the refresh token in the database and clears both cookies.

---

## 8. Environment variables

### `backend/.env`

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `NODE_ENV` | | `development` | `production` turns on `Secure` cookies and hides error stack traces |
| `PORT` | | `5000` | API port |
| `CORS_ORIGIN` | | `http://localhost:5173` | Frontend URL(s) allowed to call the API, comma-separated |
| `DB_HOST` | ✅ | | PostgreSQL host, usually `localhost` |
| `DB_PORT` | ✅ | | PostgreSQL port, usually `5432` |
| `DB_USER` | ✅ | | Database user the app logs in as |
| `DB_PASSWORD` | ✅ | | That user's password |
| `DB_NAME` | ✅ | | `student_management` |
| `JWT_SECRET` | ✅ | | Long random string used to sign access tokens |
| `ACCESS_TOKEN_TTL_MINUTES` | | `15` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | | `7` | Refresh token lifetime (how long users stay logged in) |
| `REFRESH_REUSE_GRACE_SECONDS` | | `5` | Window in which reusing a rotated token counts as a race between tabs, not theft |
| `BCRYPT_SALT_ROUNDS` | | `10` | bcrypt cost; each +1 doubles hashing time |

The server refuses to start if a required variable is missing.

### `frontend/.env`

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `VITE_API_URL` | `http://localhost:5000/api` | Backend base URL |

`.env` files are git-ignored, so they're never committed. Commit only the `.env.example` files.

---

## 9. Database schema

Defined in [`backend/database/schema.sql`](backend/database/schema.sql).

**`users`**: people who log in

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `INTEGER` identity | Primary key |
| `name` | `VARCHAR(100)` | Not null |
| `email` | `VARCHAR(255)` | Not null, unique |
| `password_hash` | `VARCHAR(255)` | bcrypt hash, never the plain password |
| `created_at` | `TIMESTAMPTZ` | Defaults to `NOW()` |

**`students`**: records managed through the CRUD API

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `INTEGER` identity | Primary key |
| `name` | `VARCHAR(100)` | Not null, not blank |
| `email` | `VARCHAR(255)` | Not null, unique |
| `age` | `SMALLINT` | Between 1 and 120 |
| `created_at` | `TIMESTAMPTZ` | Defaults to `NOW()` |

**`refresh_tokens`**: one row per login session

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `INTEGER` identity | Primary key |
| `user_id` | `INTEGER` | References `users(id)`; deleted with the user |
| `token_hash` | `CHAR(64)` | SHA-256 of the token, unique |
| `expires_at` | `TIMESTAMPTZ` | When the session ends |
| `revoked_at` | `TIMESTAMPTZ` | `NULL` while the token is usable |
| `revoked_reason` | `VARCHAR(20)` | `rotated`, `logout` or `reuse_detected` |
| `created_at` | `TIMESTAMPTZ` | Defaults to `NOW()` |

---

## 10. Design notes

- **No ORM:** every query is hand-written SQL in `models/`, using the `pg` driver.
- **SQL injection:** every query uses `$1, $2…` placeholders. User input is never concatenated into SQL.
- **Passwords:** hashed with bcrypt (unique random salt per user) and never returned by the API. Login takes about the same time whether or not the email exists, so attackers can't use response times to find accounts.
- **Token storage:** both tokens are in `httpOnly` cookies, so an XSS attack can't read them. `SameSite=Strict` stops other websites from triggering authenticated requests (CSRF). In production, cookies are also `Secure` (HTTPS only).
- **Refresh tokens:** only their SHA-256 hash is stored, so a leaked database can't be used to take over sessions.
- **Transactions:** signup (user + first session) and refresh (revoke old + insert new) each run in one transaction, so a failure never leaves half-written data.
- **Duplicate emails:** the database's `UNIQUE` constraint decides, and the service turns the violation into a **409 Conflict**. A separate "check then insert" step could race with another request.
- **Validation on both sides:** the frontend gives instant feedback; the backend (express-validator) is the real safeguard. Controllers read only `matchedData()`, so unexpected fields are ignored.
- **Central error handling:** Express 5 forwards errors from async functions automatically. One error handler maps them to status codes and never leaks stack traces in production.
- **Security middleware:** `helmet` headers, CORS limited to the frontend origin, a 10 kb JSON body limit, and rate limiting on login and signup.
- **Graceful shutdown:** on `Ctrl + C` the server finishes in-flight requests and closes the database pool.

---

## 11. Troubleshooting

| Problem | Fix |
| ------- | --- |
| `Missing required environment variables: ...` | `backend/.env` is missing or incomplete. See [step 2](#step-2-create-the-environment-files) |
| `password authentication failed for user "..."` | Wrong `DB_USER` / `DB_PASSWORD` in `backend/.env` |
| `database "student_management" does not exist` | Run `npm run db:setup` ([step 3](#step-3-create-the-database)) |
| `permission denied to create database` | `DB_USER` isn't allowed to create databases. Create it as `postgres` first ([option B, by hand](#option-b-create-a-dedicated-app-user-recommended)) |
| `permission denied for table ...` | The tables were created by a different user than `DB_USER`. Recreate them as `DB_USER`, or run `ALTER TABLE ... OWNER TO student_app` as `postgres` |
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL isn't running. On Windows, start the `postgresql-x64-<version>` service from **Services** |
| `EADDRINUSE: address already in use :::5000` | The backend is already running in another terminal |
| `Port 5173 is in use` | The frontend is already running in another terminal |
| Frontend shows "Cannot reach the server" | Start the backend; check `VITE_API_URL` in `frontend/.env` |
| Login fails with "Cannot reach the server", or you're logged out right away | Open the app at `http://localhost:5173`, not `http://127.0.0.1:5173`, and make sure `CORS_ORIGIN` in `backend/.env` matches that URL exactly. Cookies and CORS treat `localhost` and `127.0.0.1` as different sites |
| `running scripts is disabled on this system` (Windows) | Run the `.ps1` script with `powershell -ExecutionPolicy Bypass -File ...` as shown |
| `psql` is not recognized (Windows) | Use the full path `"C:\Program Files\PostgreSQL\18\bin\psql.exe"`, or add that folder to your PATH |
