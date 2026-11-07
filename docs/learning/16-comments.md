# PR 16 — Threaded comments and user-generated content

Anonymous users can read; only registered users can post. Parent replies must belong to the same video, and comments are bounded to 1,000 characters. React renders text safely as text rather than raw HTML.

**14 native platform tests passed locally.** The backend uses a flat parent ID model, leaving reply grouping to the viewer. Review comment authorization, XSS, storage constraints, pagination, rate-limiting and moderation backlog.
