import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import type { Env } from "../src/config/env";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

function withoutS3(env: Env): Env {
  return {
    ...env,
    AWS_REGION: env.AWS_REGION ?? "us-east-1",
    AWS_ACCESS_KEY_ID: undefined,
    AWS_SECRET_ACCESS_KEY: undefined,
    S3_BUCKET: undefined
  };
}

describeDb("uploads relay API (requires DATABASE_URL)", () => {
  jest.setTimeout(30_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 without bearer token", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/v1/uploads/relay")
      .set("Content-Type", "video/mp4")
      .set("X-Wellspring-S3-Key", "tenants/x/media/y.mp4")
      .send(Buffer.from("."));
    expect(res.status).toBe(401);
  });

  it("returns 400 when X-Wellspring-S3-Key is missing", async () => {
    const app = createApp(withoutS3(loadEnv()));
    const email = `ur-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app).post("/api/auth/signup").send({ email, password }).expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const res = await request(app)
      .post("/v1/uploads/relay")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "video/mp4")
      .send(Buffer.from("."))
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      error: { code: "validation_error" }
    });

    await prisma.creator.delete({ where: { id: creatorId } });
  });

  it("rejects cross-tenant relay uploads (wrong media key prefix)", async () => {
    const app = createApp(withoutS3(loadEnv()));
    const email = `ur-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app).post("/api/auth/signup").send({ email, password }).expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const otherTenantPrefix = `tenants/${randomUUID().replace(/-/g, "").slice(0, 25)}/media/`;
    const res = await request(app)
      .post("/v1/uploads/relay")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "video/mp4")
      .set("X-Wellspring-S3-Key", `${otherTenantPrefix}x.mp4`)
      .send(Buffer.from("."))
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      error: { code: "validation_error" }
    });

    await prisma.creator.delete({ where: { id: creatorId } });
  });

  it("returns 503 when S3 is not configured (valid tenant key)", async () => {
    const app = createApp(withoutS3(loadEnv()));
    const email = `ur-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app).post("/api/auth/signup").send({ email, password }).expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;
    const key = `tenants/${creatorId}/media/${randomUUID()}-clip.mp4`;

    await request(app)
      .post("/v1/uploads/relay")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "video/mp4")
      .set("X-Wellspring-S3-Key", key)
      .send(Buffer.from("."))
      .expect(503);

    await prisma.creator.delete({ where: { id: creatorId } });
  });
});
