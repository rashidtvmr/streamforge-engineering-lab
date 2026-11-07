# Security model and disclosure

This is a **synthetic educational platform**, not a service accepting real user content. Do not commit API keys or personal data.

## Implemented controls

- Read-only API, unsupported methods return 405
- Strict, bounded query and batch request parameters
- Runtime validation of server responses at the client boundary
- No raw HTML injection in the UI; React escapes rendered metadata
- Content-Type and `X-Content-Type-Options: nosniff`
- localStorage values validated, deduplicated and capped

## Not implemented (future scope)

Authentication/authorization, production rate limiting, persistent multi-user database, CSRF for state-changing endpoints, upload scanning, DRM, transcoding, audit logs, centralized telemetry, CDN and billing. Do not expose this demonstration as a production service without addressing those gaps.

If you discover a vulnerability, report it privately to the repository owner instead of posting exploit payloads in a public issue.

## Lesson 24 — Request integrity and rate limits

Unsafe `/api/v1` HTTP methods reject an explicit Origin that differs from the request Host, and reject `Sec-Fetch-Site: cross-site`. Login and registration are protected by a bounded in-memory 30-attempt/minute limiter per IP and endpoint. API responses set Referrer-Policy, Cross-Origin-Resource-Policy and Permissions-Policy.

**Validated locally:** 25 native platform tests passed, including hostile-origin rejection, same-origin account registration, cross-site Fetch Metadata protection and a deterministic injected-clock limiter.

**Still not production hardened:** in-memory rate limiting resets on restart and is not shared across replicas; IP resolution must be designed for a trusted reverse proxy; account creation requires email verification; media upload needs malware/content scanning, quota policy and transcoding. A reverse proxy must preserve or explicitly validate Host/Origin semantics. Native tests do not replace browser security review or penetration testing.
