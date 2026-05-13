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
});
