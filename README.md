# StreamForge Engineering Lab

A full-stack video discovery, community and creator **engineering learning platform** developed through **25 reviewable stacked pull requests**, not a single giant code dump.

## Features delivered across the stack

- **Viewer:** synthetic catalog, search and suggestions, sorting/categories, video watch, saved videos, personal history, likes/dislikes
- **Community:** creator subscriptions, comments and replies, owner edits, reporting, notifications
- **Collections:** private and unlisted playlists, persistent membership and ordering
- **Creator:** sign in, draft creation, metadata editing, publishing/unpublishing, bounded MP4 uploads and byte-range playback
- **Infrastructure:** SQLite persistence, versioned JSON APIs, request validation, static HTTP production runtime, Docker image, CI definition and documented security boundaries
- **Engineering:** Node unit/real HTTP/integration tests, React Testing Library, fast-check invariants, Playwright cross-feature journeys, axe accessibility scanning, bundle budgets

The 24 seeded catalog videos and test accounts are synthetic. Creator-uploaded MP4 media must be valid and belong to the creator; the sample player uses CC0 footage for seed videos.

## Prerequisites and local launch

Node 22 (native SQLite / TypeScript stripping) and npm.

```sh
git clone https://github.com/rashidtvmr/streamforge-engineering-lab.git
cd streamforge-engineering-lab
git switch edu/25-final-verification
npm install
npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies /api to the Node API at 127.0.0.1:4000. For production build and same-origin server: `npm run build && npm start`.

## Testing

```sh
node --experimental-strip-types --test tests/node/*.test.ts   # actual native integration suites, no npm packages
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
npm run check:bundle
```

All real app features have source and corresponding test coverage, but **browser and npm-dependent test runs are not yet verified passing**. The authoring container cannot resolve the npm registry, and GitHub Actions workflow jobs are failing before runners are assigned. See [runner blocker](https://github.com/rashidtvmr/streamforge-engineering-lab/issues/8), [lockfile blocker](https://github.com/rashidtvmr/streamforge-engineering-lab/issues/9) and [verification matrix](docs/TEST_MATRIX.md). Do not merge the PR stack until required CI checks actually execute and pass.

## Pull-request engineering curriculum

| Lesson | PR | Change |
| --- | --- | --- |
| 01 | [#1](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/1) | Foundation and CI |
| 02 | [#2](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/2) | TDD, pure domain and property tests |
| 03 | [#3](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/3) | HTTP APIs and contracts |
| 04 | [#4](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/4) | React discovery and watch |
| 05 | [#5](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/5) | Durable watchlist state |
| 06 | [#6](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/6) | Browser E2E and accessibility baseline |
| 07 | [#7](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/7) | Docker production runtime |
| 08 | [#10](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/10) | SQLite persistence |
| 09 | [#11](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/11) | Accounts and authenticated sessions |
| 10 | [#12](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/12) | React registration and login |
| 11 | [#13](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/13) | Watch history |
| 12 | [#14](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/14) | Likes and dislikes |
| 13 | [#15](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/15) | Creator subscriptions |
| 14 | [#16](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/16) | Playlist CRUD |
| 15 | [#17](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/17) | Playlist ordering and unlisted sharing |
| 16 | [#18](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/18) | Comments and threaded replies |
| 17 | [#19](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/19) | Comment editing and abuse reports |
| 18 | [#20](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/20) | Creator Studio drafts |
| 19 | [#21](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/21) | Publishing and catalog integration |
| 20 | [#22](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/22) | MP4 upload and range playback |
| 21 | [#23](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/23) | Trending and personalized discovery |
| 22 | [#24](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/24) | Search suggestions and recent queries |
| 23 | [#25](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/25) | Notifications and activity events |
| 24 | [#26](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/26) | Security and reliability gates |
| 25 | [#27](https://github.com/rashidtvmr/streamforge-engineering-lab/pull/27) | Full workflows, mobile navigation and release evidence |

Every lesson targets the previous unmerged lesson's branch; PR #1 targets `main`. Review **bottom-up** and merge in sequence after quality gates are green. GitHub issue numbers #8 and #9 account for the PR number gap.

## Architecture and limitations

- API: Node 22 HTTP and native SQLite, cookie sessions, versioned /api/v1 routes; local seeded /api/videos remains for video discovery.
- Durable account-related state lives in SQLite; saved watchlist stays in per-browser localStorage.
- MP4 uploads are restricted to 8 MiB and validate basic header metadata, **not** full media structure/antivirus/transcoding. This is an educational application, **not production-ready**.
- Do not use real customer data or publish to the public Internet without reviewing security, monitoring, database scaling, media protection and deployment requirements.

Review `docs/learning/`, `docs/adr/`, `SECURITY.md` and `CONTRIBUTING.md` for architecture choices, test exercises, and review rules.
