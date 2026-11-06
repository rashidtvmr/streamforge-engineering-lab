# PR 02 — Tests first: domain contracts and invariants

The catalog is a **pure function** of inputs. React and the server both depend on it; it depends on neither.

## The evidence in the Git history

1. **RED**: behavior tests and generated properties import missing functions.
2. **GREEN**: filter, sort, pagination and a deterministic seed library are added.
3. **REFACTOR**: scripts and documentation show how to execute them.

## What an invariant means

A test example checks one known input/output pair. A property checks a law over **families** of inputs. Examples here: a filter may remove items but cannot add or reorder them; paginating and concatenating all pages reconstructs the source list; sorting must not mutate an input array.

Fast-check runs generated input cases, while Node's built-in runner provides a dependency-free deterministic suite you can run without npm installation:

```sh
npm run test:domain
# or without node_modules:
node --experimental-strip-types --test tests/node/catalog.test.ts
```

## Interview exercises

What different failures do property-based tests and snapshot tests detect? Why does a stable tie-breaker matter in infinite scroll? What if two videos have the same id?
