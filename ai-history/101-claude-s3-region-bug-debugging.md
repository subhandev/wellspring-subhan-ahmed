# 02 — Debugging a Real S3 Region Bug

**Source:** Claude.ai  
**Chat URL:** https://claude.ai/chat/26ba0ac1-0e63-4aee-803e-6c389721477c  
**Date:** 2026-05-13  
**Why this is included:** Real debugging session. Presign endpoint returned 201 (looked fine) but the actual upload relay was 502. Shows how I diagnosed a non-obvious failure and corrected a genuine mistake.

---

## The Problem

Presign worked, but the S3 PUT was failing:

```
POST /v1/uploads/presign → 201 Created
uploadUrl pointed to: wellspring-media.s3.ap-south-1.amazonaws.com

POST /v1/uploads/relay → 502 Bad Gateway
{
  "code": "s3_upload_failed",
  "message": "The bucket you are attempting to access must be addressed 
               using the specified endpoint."
}
```

My first instinct was a CORS or IAM permissions issue. I was wrong.

---

## Diagnosis

**H:** Help debug and fix this issue. s3 upload not working. [pasted both request/response pairs]

**A:** [reviewed project code, traced the presign URL generation]

The error message "must be addressed using the specified endpoint" is S3's `PermanentRedirect`. The presigned URL was generated for `ap-south-1` but the bucket actually lives in `us-east-1`. S3 confirmed it in the raw response headers:

```xml
<Code>PermanentRedirect</Code>
x-amz-bucket-region: us-east-1
```

---

## The Actual Fix

```env
# .env — was wrong:
AWS_REGION=ap-south-1

# Fixed:
AWS_REGION=us-east-1
```

The SDK derives the S3 endpoint automatically from `AWS_REGION`. The presigned URL was pointing to the wrong regional endpoint because the bucket was created in us-east-1 but the env var said ap-south-1.

---

## Follow-up: Can I move the bucket to ap-south-1?

**H:** is s3 global and not region based? Did I create that bucket in wrong region? If yes then I can move it to ap-south-1

**A:** S3 bucket names are global (unique across all of AWS) but **buckets themselves are region-specific. Once created, you cannot move or change a bucket's region** — hard AWS limitation.

**Why I accepted "just change the region in .env" and moved on:** For a dev/assessment project the latency difference is irrelevant. Creating a new bucket would have meant re-adding CORS policy, updating bucket name in .env, re-testing — 30 minutes of work to solve a non-problem. I documented the decision and moved on.

---

## What I learned from this bug

The presign endpoint returning 201 masked the real error. The failure only surfaced on the actual PUT. This is why end-to-end testing of the upload flow (not just the presign call) matters — I now test by actually uploading a file, not just by checking the presign response shape.
