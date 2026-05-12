import request from "supertest";
import { loadEnv } from "../src/config/env";
import { createApp } from "../src/app";

describe("createApp", () => {
  it("GET /health returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health").expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /openapi.json exposes OpenAPI 3 when docs enabled", async () => {
    const env = loadEnv();
    const app = createApp({ ...env, ENABLE_API_DOCS: "1" });
    const res = await request(app).get("/openapi.json").expect(200);
    expect(res.body.openapi).toBe("3.0.0");
    expect(res.body.info.title).toBe("Wellspring API");
  });

  it("GET /openapi.json is omitted when ENABLE_API_DOCS=0", async () => {
    const env = loadEnv();
    const app = createApp({ ...env, ENABLE_API_DOCS: "0" });
    const res = await request(app).get("/openapi.json").expect(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "not_found" }
    });
  });

  it("GET /v1/programs returns 401 without bearer token", async () => {
    const app = createApp();
    const res = await request(app).get("/v1/programs").expect(401);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "unauthorized" }
    });
  });
});
