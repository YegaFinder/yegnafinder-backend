# Walkthrough — PR 1: Login

## What was implemented

- `POST /api/v1/auth/login` — validates email/password, issues access + refresh tokens
- Redis-backed login rate limiting (10 attempts / 15 min per IP and email)
- Redis session cache for refresh tokens (`session:{tokenHash}`)
- `lastLoginAt` updated on successful login
- Prior TypeScript fixes (import paths, JWT types, User↔RefreshToken relation)

## Prerequisites

Ensure `.env` has valid values:

```env
JWT_SECRET=your-secret-at-least-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
```

PostgreSQL and Redis must be running.

## Testing steps

### 1. Register a user

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

Check server console for the OTP (dev mode logs OTP to stdout).

### 2. Verify email

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**Expected response (200):**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "a1b2c3...",
    "user": {
      "id": "...",
      "email": "test@example.com",
      "role": "customer",
      "isEmailVerified": true,
      ...
    }
  },
  "timestamp": "..."
}
```

### 4. Negative cases

| Case | Expected |
|------|----------|
| Wrong password | `401 Invalid credentials` |
| Unverified email | `403 Email not verified` |
| 10+ failed attempts | `429 Too many login attempts` |

### 5. Verify DB state

```sql
SELECT last_login_at FROM users WHERE email = 'test@example.com';
SELECT * FROM refresh_tokens WHERE user_id = '<user-id>';
```

## Security notes

- **Refresh tokens** are opaque 80-char hex strings; only SHA-256 hashes are stored in PostgreSQL.
- **Access tokens** are short-lived JWTs (default 15m) — suitable for PWA in-memory storage.
- **Rate limiting** uses Redis keys `ratelimit:login:ip:*` and `ratelimit:login:email:*`.
- **Email enumeration** is prevented — login returns the same `401` for unknown email and wrong password.

## Swagger

Interactive docs: `http://localhost:3000/api/docs` → **auth** → `POST /auth/login`

## Next PR

PR 2 (`feature/jwt-auth`) will add `GET /users/me` and CORS configuration for the PWA origin.
