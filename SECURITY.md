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
