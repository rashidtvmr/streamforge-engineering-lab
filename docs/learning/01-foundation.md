# PR 01 — Build system, static gates and smoke tests

**Static analysis** catches type incompatibilities and common mistakes without executing code. It cannot prove user-visible behavior.

**Component tests** check an accessibility-facing contract: a screen has the expected heading and landmark. They do not need snapshots of every DOM node.

**CI** runs checks in a clean runner to expose missing implicit dependencies. It is not a substitute for production monitoring.

## Review exercise

1. Deliberately break the App heading and watch the component test fail.
2. Deliberately pass a number to a string-only function and see TypeScript fail.
3. Explain why code coverage percentage alone cannot prove correctness.

## Next steps

PR 02: pure business rules, example and property testing, deterministic fake catalog. PR 03: HTTP and contract tests. PR 04+: UI behavior and browser journeys.
