# ADR 0001 — begin with Vite, not a custom bundler

Status: Accepted (2026-11-06)

## Context

Our goal is to learn engineering practices, not spend the first month implementing module resolution, HMR, TypeScript transpilation and source maps.

## Decision

Use **Vite + React + TypeScript**, strict static analysis, explicit domain modules, a minimal Node API, deterministic sample content, Playwright browser tests and GitHub Actions. Build distinct changes as stacked PRs.

## Implications

- A custom bundler remains a separate future lab.
- Keep backend logic behind an HTTP boundary, not inside React effects.
- Public API schemas and UI state need independent tests.
- Synthetic videos and one CC0 demo stream are not a production content delivery platform.
- GitHub Actions must execute tests before merging; authoring CI files alone is not validation.
- A checked-in dependency lockfile and npm ci are the target; offline authoring may temporarily require npm install in CI until a lockfile can be generated and reviewed.
