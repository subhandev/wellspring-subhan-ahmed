import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("session API validation error details", () => {
  jest.setTimeout(60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 400 with row-level field details on invalid create body", async () => {
    const app = createApp();
    const password = "SecurePass1!";
    const email = `sv-${randomUUID()}@example.com`;

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;
    const creatorId = signup.body.data.creator.id as string;

    const prog = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Program", description: "" })
      .expect(201);
    const programId = prog.body.id as string;

    const res = await request(app)
      .post("/v1/sessions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        programId,
        title: "",
        durationSeconds: 0,
        instructorName: "",
        tags: []
      })
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: "validation_error",
        details: {
          fieldErrors: expect.any(Object),
          formErrors: expect.any(Array)
        }
      }
    });
    const fieldErrors = res.body.error.details.fieldErrors as Record<string, string[]>;
    expect(fieldErrors.title?.length).toBeGreaterThan(0);

    await prisma.session.deleteMany({ where: { programId } });
    await prisma.program.deleteMany({ where: { id: programId } });
    await prisma.creator.delete({ where: { id: creatorId } });
  });
});
