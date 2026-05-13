import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("GET /v1/audit", () => {
  jest.setTimeout(30_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns audit rows with actorEmail after a write", async () => {
    const app = createApp();
    const email = `audit-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);

    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const created = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Audit fixture program" })
      .expect(201);

    const programId = created.body.id as string;

    const audit = await request(app).get("/v1/audit").set("Authorization", `Bearer ${token}`).expect(200);

    expect(Array.isArray(audit.body.auditLogs)).toBe(true);
    const row = audit.body.auditLogs.find((r: { action?: string }) => r.action === "program.created");
    expect(row).toBeTruthy();
    expect(row).toMatchObject({
      actorId: creatorId,
      actorEmail: email,
      action: "program.created",
      targetType: "program",
      targetId: programId
    });
    expect(row.metadata).toMatchObject({ title: "Audit fixture program" });

    await prisma.creator.delete({ where: { id: creatorId } });
  });
});
