# PR 08 — Durable SQLite, migration repeatability and storage boundaries

SQL constraints protect against orphan sessions; database files remain out of Git. Node 22's built-in SQLite eliminates an external database dependency for this educational demo, although its API is experimental.

- Migration is idempotent, native tests exercise on-disk reopen and FK constraints.
- A new `/api/v1/ping` confirms the platform router.
- The older read-only `/api/videos` endpoints remain intact.
- Production stores data under `data/streamforge.sqlite`, while test applications default to isolated in-memory databases.

Review questions: What is WAL mode? Why can a green unit test still lose data after a process restart? When should you migrate to Postgres?
