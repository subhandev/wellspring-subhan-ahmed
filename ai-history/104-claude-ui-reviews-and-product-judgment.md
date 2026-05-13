# 05 — UI Reviews: Pushing Back on What to Show

**Source:** Claude.ai  
**Chat URLs:**
- https://claude.ai/chat/b6239f93-2030-4a8f-a6ac-4b3b0b8e59a9
- https://claude.ai/chat/09-s3-access-denied (access denied fix)
**Date:** 2026-05-13  
**Why this is included:** Shows product judgment — I reviewed AI-generated UI output and pushed back on what fields to surface and what was missing. Also captures the pre-signed GET URL fix, which was a real architectural correction.

---

## Session detail page: removing database-dump fields

The initial session detail page showed everything from the DB row:

```
Title, Instructor, Duration, Tags,
Media URL (full raw S3 URL),
MIME type,
Program (raw cuid),
List order,
Session ID (raw cuid),
Created, Last updated
```

**H:** do we need to show all these on the session details?

**A:**
- Keep: Title, Instructor, Duration, Tags, Media (as link only), Program (as link), List order, Created, Last updated
- Remove: Session ID, MIME type, raw URLs

**My judgment and why I agreed:** MIME type and raw S3 URLs are implementation details — they make the page feel like a database dump, not an admin interface. Session ID belongs in dev tools at most. I accepted this because it matched what I'd want if I were the creator using this. The raw cuid as "Program" is particularly bad UX — a link to the program with its title is what belongs there.

**What I rejected from the suggestion:** Claude suggested "a small copy icon for Session ID for debugging." I didn't add this. For a take-home assessment, it adds UI complexity for no demonstrated benefit. If a real user needed it, it'd be in a developer settings panel, not the main detail view.

---

## Bulk import screen: missing validation feedback

The initial bulk import screen had:
- Client import ID field
- CSV file upload input

That's it.

**H:** Now verify the bulk import screen [pasted the fields]

**A:** Critical gap: **no validation feedback area**. The assessment explicitly requires "row-level validation feedback (which rows failed and why)." There should be a results section appearing after upload.

Also missing:
- Submit/upload button
- Generate ID button for client import ID
- CSV template download link

**Why this review was necessary:** I'd built the inputs but hadn't built the output — the results table that appears after an import attempt. This is the most visible part of the feature from the assessment's perspective. The fix: added a results state to the component that renders after the import API call returns, showing a per-row table with status and error message columns.

---

## Pre-signed GET URL: fixing AccessDenied on media playback

After uploading a file successfully, opening the stored URL returned:

```xml
<Code>AccessDenied</Code>
<Message>Access Denied</Message>
```

**H:** on opening s3 urls it does not open and shows this [pasted error]

**A:** This is correct security behavior — your bucket is private. You're trying to open the raw S3 URL directly, but it requires a pre-signed GET URL to access.

Fix: When returning session data from the API, generate a pre-signed GET URL on the fly from the stored key:

```typescript
const mediaUrl = session.mediaKey 
  ? await getPresignedGetUrl(session.mediaKey)
  : null;
return { ...session, mediaUrl };
```

**What I changed in my model:** I was storing the full S3 URL in the DB. I changed this to store only the S3 key (the path), and generate the signed URL at serve time. This is the correct pattern — URLs expire, keys don't. Storing a URL that expires in 5 minutes in a DB column you query hours later is broken by design.

**Why this matters architecturally:** The assessment specifically asks for "pre-signed URLs scoped, time-limited, and tied to the requesting tenant." A private bucket + on-demand signed GET URLs is exactly that. The frontend never touches a raw S3 URL.
