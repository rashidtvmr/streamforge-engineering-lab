# PR 03 — Test boundaries, not implementation details

The API is built using the Node.js HTTP server so domain/HTTP integration tests can run **without any npm dependencies** in a restricted environment.

- `tests/node/api.test.ts`: an actual ephemeral HTTP server + real `fetch`, not mocked routing.
- `src/contracts/catalog.ts`: runtime response shape verification because TypeScript does not validate JSON.
- `src/api/catalogClient.ts`: the client injects `fetch` for determinism and browser tests.
- `server/app.ts`: strict query bounds, duplicate parameter protection, 404/405 responses, JSON and nosniff headers.

## Execution

```sh
node --experimental-strip-types --test tests/node/catalog.test.ts tests/node/api.test.ts
```

## Questions

Why is a domain unit test insufficient to prove that `GET /api/videos` works? Why is a consumer contract useful? What is the difference between a test double and a test server?

## Boundaries

Synthetic, in-memory, unauthenticated demo. Real video upload/auth/billing/rate limiting/persistent stores are future engineering projects, not properties of this milestone.
