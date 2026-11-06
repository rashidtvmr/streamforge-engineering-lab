# StreamForge verification matrix

| Layer | Test files | Runs without npm? | What it protects |
| --- | --- | --- | --- |
| Typecheck | TS strict config | No (TypeScript package required) | Type-level structural contracts |
| Unit examples | `tests/node/catalog.test.ts` | Yes (Node 22) | Known domain decisions |
| Property tests | `src/domain/catalog.property.test.ts` | No | General laws over generated inputs |
| Persistence | `tests/node/watchlist.test.ts` | Yes | Storage sanitation and state transitions |
| HTTP integration | `tests/node/api.test.ts` | Yes | Real ephemeral server, validation, error codes |
| Consumer contract | `src/api/catalogClient.test.ts` | No | Invalid JSON and HTTP errors |
| React component | `src/App.test.tsx` | No | Loading, filters, pagination, watchlist |
| Browser E2E | `e2e/*.spec.ts` | No | Real journeys and mobile flows |
| Accessibility | `e2e/accessibility.spec.ts` | No | WCAG serious/critical violations |
| Performance | `scripts/check-bundle.mjs` | Yes if dist exists | JS/CSS build-byte budget |

## Evidence from authoring environment, 2026-11-06

- Node v22 native suites: **19 passed, 0 failed**.
- Pure domain/storage modules: local global TypeScript strict check passed.
- TSX files: TypeScript syntax transpilation completed without syntax diagnostics.
- Bundle-budget script: exercised against small synthetic dist assets; **passed**. This does **not** prove the real built assets are within budget.
- npm registry access unavailable from authoring container; React/Vitest/Playwright installs and executions not verified.
- GitHub Actions runs currently fail before receiving a runner (jobs have no runner assigned and no steps executed). Inspect repository Actions settings/account quotas and rerun them.

**Do not claim the full E2E suite or release pipeline is green before the workflow actually executes.**

## Suggested release gate

For protected main: require the quality job, browser job, at least one code review, no unresolved blocking threads and no force pushes. Dependency lockfile must be generated and reviewed before production deployment.
