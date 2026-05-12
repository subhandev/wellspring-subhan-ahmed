import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("session mediaUrl tenant prefix", () => {
  jest.setTimeout(60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects cross-tenant forged session mediaUrl", async () => {
    const app = createApp();
    const password = "SecurePass1!";

    const emailA = `ma-${randomUUID()}@example.com`;
    const emailB = `mb-${randomUUID()}@example.com`;

    const signupA = await request(app)
      .post("/api/auth/signup")
      .send({ email: emailA, password })
      .expect(201);
    const signupB = await request(app)
      .post("/api/auth/signup")
      .send({ email: emailB, password })
      .expect(201);

    const tokenA = signupA.body.data.accessToken as string;
    const creatorBId = signupB.body.data.creator.id as string;

    const prog = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Program", description: "" })
      .expect(201);
    const programId = prog.body.id as string;

    const forgedUrl = `https://cdn.example.com/tenants/${creatorBId}/media/fake-uuid-file.mp3`;

    const createBad = await request(app)
      .post("/v1/sessions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        programId,
        title: "S1",
        durationSeconds: 60,
        instructorName: "Coach",
        mediaUrl: forgedUrl,
        mediaType: "audio/mpeg"
      })
      .expect(400);
    expect(createBad.body).toMatchObject({
      success: false,
      error: {
        code: "validation_error",
        details: {
          fieldErrors: { mediaUrl: expect.any(Array) }
        }
      }
    });

    const sess = await request(app)
      .post("/v1/sessions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        programId,
        title: "S2",
        durationSeconds: 60,
        instructorName: "Coach"
      })
      .expect(201);
    const sessionId = sess.body.id as string;

    const patchBad = await request(app)
      .patch(`/v1/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ mediaUrl: forgedUrl, mediaType: "audio/mpeg" })
      .expect(400);
    expect(patchBad.body).toMatchObject({
      success: false,
      error: {
        code: "validation_error",
        details: {
          fieldErrors: { mediaUrl: expect.any(Array) }
        }
      }
    });

    const creatorAId = signupA.body.data.creator.id as string;
    const goodUrl = `https://cdn.example.com/tenants/${creatorAId}/media/uuid-file.mp3`;
    await request(app)
      .patch(`/v1/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ mediaUrl: goodUrl, mediaType: "audio/mpeg" })
      .expect(200);

    await prisma.session.deleteMany({ where: { programId } });
    await prisma.program.deleteMany({ where: { id: programId } });
    await prisma.creator.deleteMany({
      where: { id: { in: [creatorAId, creatorBId] } }
    });
  });
});
