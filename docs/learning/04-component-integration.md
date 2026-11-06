# PR 04 — UI component integration tests

React Testing Library tests the application through **roles, labels and user-observable outcomes**, not internal state fields.

## Boundaries

- `createCatalogClient` receives a fetch stub in its own unit tests.
- `App` receives a `CatalogClient` fake whose behavior comes from the **real** domain catalog functions.
- The real API and browser will be exercised by Playwright in a later PR.

## What to inspect

- Loading, empty, error and retry states have explicit accessible UX.
- Category changes and searching use the same public API contract.
- Pagination appends later pages instead of replacing previously loaded items.
- Watch selection uses seeded catalog items and shared CC0 demonstration footage.
- React effects abort obsolete requests; a stale response must not overwrite a newer search.

## Practice

Introduce an artificial slow response to an earlier search and prove it cannot replace new results. Find out why `getByRole` is generally more robust than `querySelector('.card')`.
