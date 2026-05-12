import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app";

const prisma = new PrismaClient();

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("tenant isolation — CSV import", () => {
  jest.setTimeout(60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects cross-tenant import into another program", async () => {
    const app = createApp();
    const password = "SecurePass1!";

    const emailA = `ia-${randomUUID()}@example.com`;
    const emailB = `ib-${randomUUID()}@example.com`;

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
      .send({ title: "Import victim program" })
      .expect(201);

    const programId = prog.body.id as string;

    const csv = [
      "client_row_id,program_id,title,duration_seconds,instructor_name,tags",
      `r1,${programId},Bad import row,120,Someone,`
    ].join("\n");

    const res = await request(app)
      .post("/v1/import/sessions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        clientImportId: `import-${randomUUID()}`,
        csv
      })
      .expect(200);

    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].ok).toBe(false);
    expect(res.body.results[0].errors?.[0] ?? "").toMatch(/program not found/i);

    await prisma.creator.deleteMany({
      where: { id: { in: [signupA.body.data.creator.id, signupB.body.data.creator.id] } }
    });
  });
});
