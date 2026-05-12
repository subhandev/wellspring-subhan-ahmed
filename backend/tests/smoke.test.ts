import request from "supertest";
import { createApp } from "../src/app";

describe("createApp", () => {
  it("GET /health returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health").expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /v1/programs returns scaffold not_implemented", async () => {
    const app = createApp();
    const res = await request(app).get("/v1/programs").expect(501);
    expect(res.body).toMatchObject({ error: "not_implemented", module: "programs" });
  });
});
