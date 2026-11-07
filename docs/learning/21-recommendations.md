# PR 21 — Explainable recommendation ranking

Trending is a deterministic function of views and age with an injected clock, and For You boosts followed creators while penalizing already watched videos. The algorithm is intentionally explainable, not an ML recommendation system.

**21 native platform tests passed locally** including rankings; React and Playwright tests are authored but still blocked from running. Review cold-start handling, bias, feedback loops, stability and privacy of per-user signals.
