# PR 24 — Security and reliability gates

A passing happy-path test does not prove safe handling of hostile input. A realistic review should consider unauthorized access, cross-origin state changes, request flooding and response-header defenses.

### Tests run (local Node v22 native runner)

- Existing platform suite: accounts, data isolation, video publication, media, reactions, subscriptions, playlists, comments, search and notifications
- New controlled-clock unit test of fixed-window rate limiter
- Real HTTP integration: hostile Origin blocked with 403, same-origin account creation allowed, cross-site Fetch Metadata blocked
- Security headers verified on actual HTTP responses

**Result: 25 native tests passed / 0 failed.**

### Exercise

How could a distributed cluster bypass a per-process rate limiter? Why must proxies preserve a trusted Host value? How should CSRF, authentication, rate limiting and session controls be layered together?

### Reviewer note

This is an educational baseline, not proof of production security. Browser tests and CI cannot run until npm package access and GitHub runner provisioning are fixed.
