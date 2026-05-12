import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("tenant isolation — programs", () => {
  jest.setTimeout(45_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects cross-tenant program access", async () => {
    const app = createApp();
    const password = "SecurePass1!";

    const emailA = `a-${randomUUID()}@example.com`;
    const emailB = `b-${randomUUID()}@example.com`;

    const signupA = await request(app)
      .post("/v1/auth/signup")
      .send({ email: emailA, password })
      .expect(201);
    const signupB = await request(app)
      .post("/v1/auth/signup")
      .send({ email: emailB, password })
      .expect(201);

    const tokenA = signupA.body.accessToken as string;
    const tokenB = signupB.body.accessToken as string;

    const created = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Tenant A program", description: "x" })
      .expect(201);

    const victimId = created.body.id as string;

    const steal = await request(app)
      .get(`/v1/programs/${victimId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    expect(steal.body.message).toMatch(/not found/i);

    await prisma.program.deleteMany({ where: { id: victimId } });
    await prisma.creator.deleteMany({
      where: { id: { in: [signupA.body.creator.id, signupB.body.creator.id] } }
    });
  });
});
