# PR 17 — Ownership, soft deletes and abuse reports

Only an author can edit or soft-delete their own comment. Other signed-in viewers may file one abuse report per comment. A soft delete removes the comment from public listings while retaining its database row for audit and preserving child reply references.

**15 native platform tests passed locally** through this milestone. The moderation queue and administrative adjudication are future work; user-submitted reports are not automatic takedowns. Review SQL authorization and error code semantics.
