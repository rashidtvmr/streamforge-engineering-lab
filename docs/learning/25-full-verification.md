# PR 25 — Release gates, complete product journeys and cross-feature contracts

## Real bug discovered and fixed

The seed catalog used IDs such as `video-001`. Creator videos used `video-<UUID>`. The older history, playlist, comments, reactions and local watchlist validators only accepted numeric seed IDs. As a result, a published creator video could appear in discovery but could not enter those adjacent workflows.

This PR introduces one shared ID predicate across domain, persistence and API boundaries. A new **actual HTTP + SQLite native test** exercises two users: subscription → creator draft → upload → publication → notification → watch history → playlist → reaction → comment → unpublish.

## Mobile and accessibility

The desktop sidebar disappears at tablet/phone widths. The initial mobile header exposed only the account and saved videos, so creator and community features were unreachable. An accessible expandable mobile navigation now exposes the full product across small screens.

## Additional Playwright tests

- Cross-feature full browser user journey from registering to publishing, uploaded media, comments, reactions, playlist and history
- Phone navigation for Creator Studio, Playlists and Account
- Cross-site HTTP security regression against a real backend

The Playwright suite is **authored, not executed**, pending availability of npm and GitHub-hosted runner jobs.

## Verified native test result

**27/27 passed** on Node 22 using native test runner and a local reconstructed backend. This does not substitute for React/Vitest/Playwright/production build execution. See [TEST_MATRIX](../TEST_MATRIX.md) and GitHub issues #8/#9.

## Interview review tasks

1. Design a contract test that prevents service teams from disagreeing on ID formats.
2. Distinguish component, integration, HTTP end-to-end and real-browser end-to-end.
3. Explain why a PR with authored E2E tests but no executed CI cannot be marked release-ready.
4. Explain how to use git bisect and feature flags when a release regression spans multiple stacks.
