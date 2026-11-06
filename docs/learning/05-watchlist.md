# PR 05 — Reliable user state and one-request saved-library hydration

**Client state** is not inherently durable. This PR uses a storage gateway so the component sees an interface rather than the browser global.

## Test categories

- Pure unit: toggling a saved id twice restores the original set, unless the id is invalid.
- Input/security: invalid and duplicated storage ids are removed; entries are capped at 24.
- Persistence integration: a fake storage backend roundtrips state and recovers from invalid JSON.
- HTTP integration: `GET /api/videos/lookup?ids=...` validates inputs, preserves order, and returns data with one request.
- Component: unmount/remount persists a save; saved view is hydrated via the API, not just the current search results.

## Why a batch endpoint?

Making one HTTP request for every saved video (N+1) unnecessarily multiplies latency and infrastructure load. A bounded batch lookup demonstrates an appropriate API design without a database.

## Limitations

Saved videos are local to one browser, not a user account. The catalog and local library are synthetic. Authentication, cross-device sync, watch-history storage and backend persistence require a separate design and security review.

## Exercise

What happens if the storage backend rejects writes? How would you implement versioned migrations without losing a user's saved library?
