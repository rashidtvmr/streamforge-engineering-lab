# PR 11 — History as persisted, per-user state

Use a composite key `(user_id, video_id)` and an upsert to avoid duplicate entries, then retrieve recently watched items in deterministic order. Unauthorized clients cannot list or mutate someone else's history. The React watch-view records an open (progress=0), and the history panel uses the existing batch catalog API.

Native Node tests for unauthorized access, idempotent progress, invalid input and clear **passed locally**. The Playwright journey is written but awaits an available browser dependency runner.
