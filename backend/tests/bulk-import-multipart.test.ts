import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("CSV import multipart", () => {
  jest.setTimeout(60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("imports sessions from multipart file upload", async () => {
    const app = createApp();
    const password = "SecurePass1!";
    const email = `imp-${randomUUID()}@example.com`;

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const prog = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Import multipart program" })
      .expect(201);
    const programId = prog.body.id as string;

    const clientImportId = `multipart-${randomUUID()}`;
    const csv = [
      "client_row_id,program_id,title,duration_seconds,instructor_name,tags",
      `row-a,${programId},Session A,60,Coach,,`
    ].join("\n");

    const res = await request(app)
      .post("/v1/import/sessions")
      .set("Authorization", `Bearer ${token}`)
      .field("clientImportId", clientImportId)
      .attach("file", Buffer.from(csv), "sessions.csv")
      .expect(200);

    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].ok).toBe(true);
    expect(res.body.results[0].idempotent).toBeUndefined();

    await prisma.creator.deleteMany({ where: { id: creatorId } });
  });

  it("returns idempotent success on retry with same client import id and row id", async () => {
    const app = createApp();
    const password = "SecurePass1!";
    const email = `imp2-${randomUUID()}@example.com`;

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const prog = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Idempotent import program" })
      .expect(201);
    const programId = prog.body.id as string;

    const clientImportId = `idem-${randomUUID()}`;
    const csv = [
      "client_row_id,program_id,title,duration_seconds,instructor_name,tags",
      `idem-row,${programId},Session B,90,Coach,,`
    ].join("\n");

    const first = await request(app)
      .post("/v1/import/sessions")
      .set("Authorization", `Bearer ${token}`)
      .field("clientImportId", clientImportId)
      .attach("file", Buffer.from(csv), "sessions.csv")
      .expect(200);
    expect(first.body.results[0].ok).toBe(true);
    expect(first.body.results[0].idempotent).toBeUndefined();
    const sessionId = first.body.results[0].sessionId as string;

    const second = await request(app)
      .post("/v1/import/sessions")
      .set("Authorization", `Bearer ${token}`)
      .field("clientImportId", clientImportId)
      .attach("file", Buffer.from(csv), "sessions.csv")
      .expect(200);
    expect(second.body.results[0].ok).toBe(true);
    expect(second.body.results[0].idempotent).toBe(true);
    expect(second.body.results[0].sessionId).toBe(sessionId);

    await prisma.creator.deleteMany({ where: { id: creatorId } });
  });

  it("returns 400 when multipart request has no CSV file", async () => {
    const app = createApp();
    const password = "SecurePass1!";
    const email = `imp3-${randomUUID()}@example.com`;

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const res = await request(app)
      .post("/v1/import/sessions")
      .set("Authorization", `Bearer ${token}`)
      .field("clientImportId", `no-file-${randomUUID()}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(String(res.body.error?.message ?? "")).toMatch(/csv file is required/i);

    await prisma.creator.deleteMany({ where: { id: creatorId } });
  });
});
