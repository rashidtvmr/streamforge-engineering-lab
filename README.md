# StreamForge Engineering Lab

**A video discovery + saved-library application built with test-first engineering and small, reviewable GitHub pull requests.**

Built for learning large-team software engineering practices. StreamForge is a demo platform: 24 deterministic synthetic videos, search/filter/sort/pagination, a detail/watch page, and a locally persisted watchlist. A single shared CC0 clip demonstrates the player. There are no real accounts, uploads, creator monetization, subscription billing or production CDN.

## Technology

- Frontend: React 19, TypeScript (strict), Vite, accessible responsive CSS
- Backend: Node 22 built-in HTTP server and explicit validated JSON contracts
- Domain: pure functions, static deterministic fixtures and immutable operations
- Client state: injectable localStorage gateway with safe parsing
- Tests: Node built-in test runner, Vitest, React Testing Library, fast-check, Playwright, axe-core
- Delivery: GitHub Actions, quality gates, browser reports, Dependabot, bundle-size budget

## Run

Install Node 22 or newer. Network access to npm is needed for the initial install.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The combined dev command runs Vite on 5173 and the API on 4000. Vite proxies `/api` to the API.

## Execute tests

```sh
npm run test:native         # node:test domain, persistence, actual HTTP integration (no node_modules required)
npm run test:components     # Vitest + React Testing Library + fast-check
npm run test:e2e           # Playwright real browser + actual HTTP API + axe-core
npm run typecheck
npm run lint
npm run build
npm run check:bundle
npm run test:coverage
```

To run just the offline-native suites without any npm installation:

```sh
node --experimental-strip-types --test tests/node/*.test.ts
```

Playwright needs Chromium installed once: `npx playwright install chromium`.

## Read the PRs in order

| PR | Topic | Review target |
| --- | --- | --- |
| [#1](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/1) | Vite + TS foundation | Types, lint, component smoke tests, CI |
| [#2](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/2) | Domain + TDD | RED/GREEN/REFACTOR, properties and invariants |
| [#3](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/3) | Backend API | HTTP integration, input validation and contract boundaries |
| [#4](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/4) | Discovery UI | Behavior-driven React component integration |
| [#5](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/5) | Saved library | Persistence, normalization and N+1 avoidance |
| [#6](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/6) | Browser and delivery gates | Real user journeys, responsive a11y and artifact reports |

PRs are **stacked**, each one targeting its predecessor's head branch. Review from #1 upward. Do not merge until CI is green; after merging the previous PR, retarget the next PR to `main` if GitHub has not done so automatically.

## Engineering contracts

See `docs/adr/` for architectural decisions, `docs/learning/` for exercises, `CONTRIBUTING.md` for review conventions, and `SECURITY.md` for the synthetic demo's threat model.

### Known operational limitations

- Local development requires npm packages; the authoring environment used for the initial PRs cannot contact the npm registry. Native Node tests **were executed**; React/Vitest/Playwright must be run after installing dependencies.
- GitHub Actions runs were created but failed before a runner was assigned, so CI results are **not green**. Review GitHub Actions runner/account settings and rerun the workflows.
- No checked-in `package-lock.json` was generated in this offline authoring environment. Pinning direct versions is insufficient for full reproducibility; after a successful `npm install`, commit the generated lockfile and switch CI from `npm install` to `npm ci`.
- A watchlist stored in localStorage is not synchronized across devices. Static demo footage requires internet access for playback.
