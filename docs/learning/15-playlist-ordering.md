# PR 15 — Atomic ordering, visibility, and shareable read models

Playlist order changes run in an IMMEDIATE SQLite transaction: either every position changes or none do. The server rejects missing/duplicated item IDs. A private playlist remains private, while an unlisted playlist is viewable by someone with a link without granting edit access.

The React playlist organizer supports moving videos and switching visibility; an anonymous shared view reads only published/unlisted content. **13 native platform tests passed locally**. Review threat model for link guessing and public/private distinctions.
