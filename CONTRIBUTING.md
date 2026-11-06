# Contributing to StreamForge

Treat every PR as an engineering learning unit.

1. Write a failing test first for new behavior (RED). Commit it.
2. Implement the minimum behavior to pass (GREEN). Commit it.
3. Refactor, document decisions and add observability (REFACTOR). Commit it.
4. Run typecheck, lint, unit/integration tests, production build and E2E checks.
5. Describe risks, limitations and rollback in the PR.
6. Do not merge while critical checks fail.

Prefer semantic selectors in UI tests and deterministic fixtures. Test public behavior and domain invariants rather than internal implementation details. Isolate network, clock, randomness and persistence behind boundaries.
