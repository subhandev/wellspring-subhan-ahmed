import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("auth API (requires DATABASE_URL)", () => {
  jest.setTimeout(30_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("signup, login, and GET /v1/auth/me", async () => {
    const app = createApp();
    const email = `test-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/v1/auth/signup")
      .send({ email, password })
      .expect(201);

    expect(signup.body).toMatchObject({
      creator: { email },
      accessToken: expect.any(String)
    });

    const me = await request(app)
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${signup.body.accessToken}`)
      .expect(200);

    expect(me.body).toMatchObject({ email, id: signup.body.creator.id });

    const login = await request(app)
      .post("/v1/auth/login")
      .send({ email, password })
      .expect(200);

    expect(login.body.accessToken).toBeTruthy();

    await prisma.creator.delete({ where: { id: signup.body.creator.id } });
  });
});
