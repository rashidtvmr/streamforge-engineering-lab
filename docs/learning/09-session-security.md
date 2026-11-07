# PR 09 — Real account credentials and server-side sessions

Registration creates SQLite-backed accounts with per-user random salts and `scrypt` password hashes. Sessions use random 256-bit tokens; only token hashes are stored server-side. Cookies are `HttpOnly`, `SameSite=Lax`, and scoped to `/api/v1`. Configure `COOKIE_SECURE=true` behind HTTPS.

Native HTTP tests cover registration, stored password privacy, malformed input, invalid login, duplicate accounts, session lookup and sign-out. Sessions expire after seven days.

**Not complete production authentication:** add rate limiting, CSRF/origin defenses, email verification, password reset and secure cookie configuration behind TLS before exposing real users.
