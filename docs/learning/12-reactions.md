# PR 12 — Idempotency and reaction aggregation

One reaction per user/video is enforced using a composite primary key. PUT is idempotent and replaces the prior reaction; DELETE is idempotent. GET returns aggregate counts and the caller's current reaction without exposing other users.

**Native tests passed locally:** unauthorized write, duplicate PUT, like-to-dislike, malformed input and DELETE. The watch view adds accessible pressed-state controls; browser tests await npm availability.
