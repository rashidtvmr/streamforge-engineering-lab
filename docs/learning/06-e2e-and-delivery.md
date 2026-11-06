# PR 06 — Real browser journeys and reliable release gates

## Why E2E tests are expensive

A browser journey validates the layers together: DOM, React, network requests, Node routing, JSON contracts and browser storage. It is slower and more fragile than a pure unit test. Use a **few critical journeys** and leave most edge cases to smaller tests.

## This suite

- Browse → filter category → search → watch a video
- Fetch more results → change sort order
- API failure → visible error → retry → recovery
- Save → reload → reopen saved library → remove
- Narrow mobile viewport → navigate to saved library
- Axe WCAG scan (fail on serious or critical violations)
- API refuses oversized page size

## Keeping tests deterministic

No real account, paid provider, randomized identity, live catalog or system clock. Synthetic seed data is stable. The video element is checked for accessibility, not whether a remote media CDN downloaded sample footage.

## Quality pipeline

1. Typecheck and lint
2. Native domain/API/storage tests
3. Vitest component and property tests
4. Production build and JS/CSS byte budget
5. Coverage artifact
6. Chromium E2E and axe accessibility audit with traces/reports

**Do not assume the tests passed because this document exists.** The first GitHub Actions runs failed before runner assignment. Native Node tests passed locally; browser tests require npm dependencies and a working CI runner.

## Review exercises

Why can a unit test pass when an E2E journey fails? How should screenshot snapshots be handled? Why must CI attach traces on failure? What is an appropriate size budget for a React entrypoint?
