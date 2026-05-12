# Wireframe-aligned programs & sessions UI (2026-05-12)

Backend: program list/detail include `sessionCount` via Prisma `_count`. Frontend: program list with title→sessions link, created date, counts, row delete + modal; create/edit program copy and redirects with query flash; sessions header shows program title + count; session rows with GripVertical, index, duration formatting, list delete; new/edit session media type select + presign upload (`lib/presignUpload.ts`); navbar Import/Audit labels; import/audit page titles aligned.
