import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("sessions reorder concurrency", () => {
  jest.setTimeout(60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("concurrent POST /v1/sessions/reorder both succeed without internal_error", async () => {
    const app = createApp();
    const password = "SecurePass1!";
    const email = `sr-${randomUUID()}@example.com`;

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    const token = signup.body.data.accessToken as string;

    const prog = await request(app)
      .post("/v1/programs")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Reorder concurrency program", description: "" })
      .expect(201);
    const programId = prog.body.id as string;

    const created: string[] = [];
    for (let i = 0; i < 3; i++) {
      const sess = await request(app)
        .post("/v1/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          programId,
          title: `Session ${i}`,
          durationSeconds: 60,
          instructorName: "Coach"
        })
        .expect(201);
      created.push(sess.body.id as string);
    }

    const [a, b, c] = created;
    const orderPermA = [b, a, c];
    const orderPermB = [c, b, a];

    const [resA, resB] = await Promise.all([
      request(app)
        .post("/v1/sessions/reorder")
        .set("Authorization", `Bearer ${token}`)
        .send({ programId, orderedSessionIds: orderPermA }),
      request(app)
        .post("/v1/sessions/reorder")
        .set("Authorization", `Bearer ${token}`)
        .send({ programId, orderedSessionIds: orderPermB })
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    expect(resA.body.error).toBeUndefined();
    expect(resB.body.error).toBeUndefined();

    const list = await request(app)
      .get("/v1/sessions")
      .query({ programId })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const ids = (list.body.sessions as { id: string }[]).map((s) => s.id);
    const sig = ids.join("|");
    expect(sig === orderPermA.join("|") || sig === orderPermB.join("|")).toBe(true);

    await prisma.session.deleteMany({ where: { programId } });
    await prisma.program.deleteMany({ where: { id: programId } });
    await prisma.creator.deleteMany({ where: { id: signup.body.data.creator.id } });
  });
});
