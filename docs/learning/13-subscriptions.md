# PR 13 — Channel follow state

Store creator subscriptions keyed by `(user_id, creator)`. PUT and DELETE are idempotent. GET for a specific creator returns the caller's state, and the authenticated list endpoint shows only that user's channels.

The UI offers Subscribe on each watch page and a Subscriptions screen linked to search. **11 local native tests passed** through this stage; actual React/Playwright tests remain gated by registry and Actions runner availability.
