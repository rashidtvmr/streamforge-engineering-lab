# PR 19 — Lifecycle state and public read projections

A video draft is owned by its creator and hidden from public catalog routes. Publishing updates a state machine and projects the video into `GET /api/videos`, lookup and detail endpoints. Unpublishing removes it from those read models. Tests prove the projection never leaks drafts.

**18 native platform tests pass locally** through this stage (including status and projection). The end-to-end browser test for create → publish → discover is written but unexecuted pending npm and CI runners. Until upload support arrives, created videos use the same shared CC0 demo clip as synthetic seed videos.
