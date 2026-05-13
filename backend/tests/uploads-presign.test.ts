import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import type { Env } from "../src/config/env";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

function withDummyS3(env: Env): Env {
  return {
    ...env,
    AWS_REGION: env.AWS_REGION ?? "us-east-1",
    AWS_ACCESS_KEY_ID: "AKIA_TEST_DUMMY_ACCESS_KEY",
    AWS_SECRET_ACCESS_KEY: "dummy-secret-access-key-value",
    S3_BUCKET: "wellspring-test-uploads"
  };
}

function withoutS3(env: Env): Env {
  return {
    ...env,
    AWS_REGION: env.AWS_REGION ?? "us-east-1",
    AWS_ACCESS_KEY_ID: undefined,
    AWS_SECRET_ACCESS_KEY: undefined,
    S3_BUCKET: undefined
  };
}

describe("uploads presign — auth and content-type", () => {
  it("returns 401 without bearer token", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/v1/uploads/presign")
      .send({ fileName: "a.mp3", contentType: "audio/mpeg" })
      .expect(401);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "unauthorized" }
    });
  });

  it("returns 401 without bearer token for presign-get", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/v1/uploads/presign-get")
      .send({
        mediaUrl: "https://wellspring-media.s3.us-east-1.amazonaws.com/tenants/x/media/y.mp4"
      })
      .expect(401);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "unauthorized" }
    });
  });
});

describeDb("uploads presign API (requires DATABASE_URL)", () => {
  jest.setTimeout(30_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 400 for disallowed contentType when S3 is not configured", async () => {
    const app = createApp(withoutS3(loadEnv()));
    const email = `up-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;

    const res = await request(app)
      .post("/v1/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({ fileName: "x.bin", contentType: "application/octet-stream" })
      .expect(400);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "validation_error" }
    });

    await prisma.creator.delete({ where: { id: signup.body.data.creator.id } });
  });

  it("returns 503 when S3 is not configured", async () => {
    const app = createApp(withoutS3(loadEnv()));
    const email = `up-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;

    const res = await request(app)
      .post("/v1/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({ fileName: "clip.mp3", contentType: "audio/mpeg" })
      .expect(503);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "uploads_unconfigured" }
    });

    await prisma.creator.delete({ where: { id: signup.body.data.creator.id } });
  });

  it("returns 400 for disallowed contentType when S3 is configured", async () => {
    const app = createApp(withDummyS3(loadEnv()));
    const email = `up-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;

    const res = await request(app)
      .post("/v1/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({ fileName: "x.exe", contentType: "application/x-msdownload" })
      .expect(400);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "validation_error" }
    });

    await prisma.creator.delete({ where: { id: signup.body.data.creator.id } });
  });

  it("returns 201 and key containing authed tenant id when S3 is configured", async () => {
    const app = createApp(withDummyS3(loadEnv()));
    const email = `up-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const creatorId = signup.body.data.creator.id as string;
    const token = signup.body.data.accessToken as string;

    const res = await request(app)
      .post("/v1/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({ fileName: "clip.mp3", contentType: "audio/mpeg" })
      .expect(201);

    expect(res.body.key).toMatch(new RegExp(`^tenants/${creatorId}/media/`));
    expect(typeof res.body.publicUrl).toBe("string");
    /**
     * Browser PUT must not use URLs with flexible-checksum query params (raw body cannot satisfy CRC32 contract).
     */
    expect(String(res.body.uploadUrl)).not.toMatch(/x-amz-checksum|x-amz-sdk-checksum/i);

    const signedHeaders = new URL(res.body.uploadUrl).searchParams.get("X-Amz-SignedHeaders") ?? "";
    expect(signedHeaders).toContain("content-type");

    await prisma.creator.delete({ where: { id: creatorId } });
  });

  it("rejects cross-tenant presign-get for another tenant path in mediaUrl", async () => {
    const app = createApp(withDummyS3(loadEnv()));
    const email = `up-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;
    const otherTenant = randomUUID();

    const res = await request(app)
      .post("/v1/uploads/presign-get")
      .set("Authorization", `Bearer ${token}`)
      .send({
        mediaUrl: `https://wellspring-test-uploads.s3.us-east-1.amazonaws.com/tenants/${otherTenant}/media/x.mp4`
      })
      .expect(400);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "validation_error" }
    });

    await prisma.creator.delete({ where: { id: signup.body.data.creator.id } });
  });

  it("returns 200 and presigned viewUrl for own-tenant mediaUrl when S3 is configured", async () => {
    const app = createApp(withDummyS3(loadEnv()));
    const email = `up-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const creatorId = signup.body.data.creator.id as string;
    const token = signup.body.data.accessToken as string;

    const presignRes = await request(app)
      .post("/v1/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({ fileName: "clip.mp3", contentType: "audio/mpeg" })
      .expect(201);
    const mediaUrl = presignRes.body.publicUrl as string;

    const res = await request(app)
      .post("/v1/uploads/presign-get")
      .set("Authorization", `Bearer ${token}`)
      .send({ mediaUrl })
      .expect(200);

    expect(typeof res.body.viewUrl).toBe("string");
    expect(String(res.body.viewUrl)).toMatch(/X-Amz-Algorithm/i);
    expect(typeof res.body.expiresIn).toBe("number");
    expect(res.body.expiresIn).toBeGreaterThan(0);

    await prisma.creator.delete({ where: { id: creatorId } });
  });

  it("returns 503 for presign-get when S3 is not configured", async () => {
    const app = createApp(withoutS3(loadEnv()));
    const email = `up-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const res = await request(app)
      .post("/v1/uploads/presign-get")
      .set("Authorization", `Bearer ${token}`)
      .send({
        mediaUrl: `https://example.s3.us-east-1.amazonaws.com/tenants/${creatorId}/media/x.mp4`
      })
      .expect(503);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "uploads_unconfigured" }
    });

    await prisma.creator.delete({ where: { id: creatorId } });
  });
});
