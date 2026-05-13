# Audit log screen (2026-05-13)

- Removed Actor column: GET /audit is tenant-scoped; each Creator is their own tenant and actor is always the signed-in creator.
- Merged Target + Details into one column with stacked layout; details use whitespace-pre-wrap for multiline summaries.
- Filter panel aligned with Import Sessions: dashPageTitle/Description, dashFormSection, two-column grid + Tips inset card, dashFormActions, form submit for Apply + Enter key.
- summarizeAuditRow: session create/update/delete now returns title + newline + Program: programId when both exist in metadata.
