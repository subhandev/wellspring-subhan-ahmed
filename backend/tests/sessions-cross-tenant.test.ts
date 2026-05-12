import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("tenant isolation — sessions", () => {
  jest.setTimeout(60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects cross-tenant session access", async () => {
    const app = createApp();
    const password = "SecurePass1!";

    const emailA = `sa-${randomUUID()}@example.com`;
    const emailB = `sb-${randomUUID()}@example.com`;

    const signupA = await request(app)
      .post("/api/auth/signup")
      .send({ email: emailA, password })
      .expect(201);
    const signupB = await request(app)
      .post("/api/auth/signup")
      .send({ email: emailB, password })
      .expect(201);

    const tokenA = signupA.body.data.accessToken as string;
    const tokenB = signupB.body.data.accessToken as string;

    const prog = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "P", description: "" })
      .expect(201);

    const programId = prog.body.id as string;

    const sess = await request(app)
      .post("/v1/sessions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        programId,
        title: "S1",
        durationSeconds: 60,
        instructorName: "Coach"
      })
      .expect(201);

    const sessionId = sess.body.id as string;

    const steal = await request(app)
      .get(`/v1/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    expect(steal.body.error.message).toMatch(/not found/i);

    await prisma.session.deleteMany({ where: { id: sessionId } });
    await prisma.program.deleteMany({ where: { id: programId } });
    await prisma.creator.deleteMany({
      where: { id: { in: [signupA.body.data.creator.id, signupB.body.data.creator.id] } }
    });
  });
});
