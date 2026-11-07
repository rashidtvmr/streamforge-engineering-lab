# PR 22 — Debounced suggestions and private search history

The browser debounces suggestions by 200 ms and aborts old requests, while the server bounds query length and caps suggestions at eight. Signed-in search history is stored privately and supports explicit clearing. Public suggestions never expose private drafts.

**22 local platform tests passed** through this stage. The Playwright suggestion journey is authored but not executed due npm registry/Actions runner blockers. Review cancellation races, autocomplete accessibility, and ranking/search indexing costs.
