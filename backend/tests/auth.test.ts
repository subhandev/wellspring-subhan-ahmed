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

  it("signup, login, and GET /api/auth/me", async () => {
    const app = createApp();
    const email = `test-${randomUUID()}@example.com`;
    const password = "SecurePass1!";

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);

    expect(signup.body).toMatchObject({
      success: true,
      data: {
        creator: { email },
        accessToken: expect.any(String)
      }
    });

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${signup.body.data.accessToken}`)
      .expect(200);

    expect(me.body).toMatchObject({
      success: true,
      data: { email, id: signup.body.data.creator.id }
    });

    const login = await request(app).post("/api/auth/login").send({ email, password }).expect(200);

    expect(login.body.data.accessToken).toBeTruthy();

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${login.body.data.accessToken}`)
      .expect(204);

    await request(app).post("/api/auth/logout").expect(401);

    await prisma.creator.delete({ where: { id: signup.body.data.creator.id } });
  });
});
