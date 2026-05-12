import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

async function crossTenantProgramFixture() {
  const app = createApp();
  const password = "SecurePass1!";

  const emailA = `a-${randomUUID()}@example.com`;
  const emailB = `b-${randomUUID()}@example.com`;

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
  const creatorAId = signupA.body.data.creator.id as string;
  const creatorBId = signupB.body.data.creator.id as string;

  const created = await request(app)
    .post("/v1/programs")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Tenant A program", description: "original" })
    .expect(201);

  const victimId = created.body.id as string;

  return { app, tokenA, tokenB, victimId, creatorAId, creatorBId };
}

async function teardownProgramAndCreators(
  victimId: string,
  creatorIds: [string, string]
) {
  await prisma.program.deleteMany({ where: { id: victimId } });
  await prisma.creator.deleteMany({
    where: { id: { in: creatorIds } }
  });
}

describeDb("tenant isolation — programs", () => {
  jest.setTimeout(45_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects cross-tenant program access", async () => {
    const { app, tokenB, victimId, creatorAId, creatorBId } =
      await crossTenantProgramFixture();

    const steal = await request(app)
      .get(`/v1/programs/${victimId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    expect(steal.body.error.message).toMatch(/not found/i);

    await teardownProgramAndCreators(victimId, [creatorAId, creatorBId]);
  });

  it("rejects cross-tenant program patch", async () => {
    const { app, tokenA, tokenB, victimId, creatorAId, creatorBId } =
      await crossTenantProgramFixture();

    const patched = await request(app)
      .patch(`/v1/programs/${victimId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "Stolen title" })
      .expect(404);

    expect(patched.body.error.message).toMatch(/not found/i);

    const intact = await request(app)
      .get(`/v1/programs/${victimId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(intact.body.title).toBe("Tenant A program");

    await teardownProgramAndCreators(victimId, [creatorAId, creatorBId]);
  });

  it("rejects cross-tenant program delete", async () => {
    const { app, tokenA, tokenB, victimId, creatorAId, creatorBId } =
      await crossTenantProgramFixture();

    const del = await request(app)
      .delete(`/v1/programs/${victimId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    expect(del.body.error.message).toMatch(/not found/i);

    await request(app)
      .get(`/v1/programs/${victimId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    await teardownProgramAndCreators(victimId, [creatorAId, creatorBId]);
  });
});
