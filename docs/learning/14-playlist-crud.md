# PR 14 — Owned collections, N+1 avoidance, and unique membership

Playlists are private by default and owned by the current account. `playlist_items` uses a composite key to make repeat POST idempotent. The UI creates and deletes playlists, adds videos from the player, and loads list content via the batch catalog endpoint.

**12 local native platform tests passed** through this milestone. A real browser journey has been authored; Playwright still needs dependencies and a working Actions runner. Review SQL ownership checks and FK cascade deletion.
