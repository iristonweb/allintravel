import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

describe("createApp", () => {
  let app: Express;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.VERCEL = "1";
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET ?? "vitest-ci-session-secret-min-32-chars";
    const { createApp } = await import("./createApp");
    ({ app } = await createApp());
  }, 30_000);

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.database).toBe("boolean");
  });

  it("GET /api/auth/config returns public auth flags", async () => {
    const res = await request(app).get("/api/auth/config");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ emailSignup: true });
    expect(res.body).toHaveProperty("googleOAuth");
    expect(res.body).toHaveProperty("databaseConfigured");
    expect(res.body).toHaveProperty("sessionConfigured");
  });

  it("GET /api/auth/user returns 401 without session", async () => {
    const res = await request(app).get("/api/auth/user");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("GET /api/push/vapid-public-key returns enabled flag", async () => {
    const res = await request(app).get("/api/push/vapid-public-key");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("enabled");
  });

  it("GET /api/places returns array", async () => {
    const res = await request(app).get("/api/places");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/auth/login returns 401 for invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "short" });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: "invalid" });
  }, 15_000);

  it("GET /api/search/users returns without server error", async () => {
    const res = await request(app).get("/api/search/users?q=ab");
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBe(200);
  });

  it("GET /api/geo/autocomplete returns suggestions array", async () => {
    const res = await request(app).get("/api/geo/autocomplete?q=mos");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/trips returns 401 without session", async () => {
    const res = await request(app).post("/api/trips").send({ title: "Test" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("POST /api/upload returns 401 without session", async () => {
    const res = await request(app).post("/api/upload");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("unknown API route returns 404 with message", async () => {
    const res = await request(app).get("/api/__does-not-exist__");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Not Found");
  });
});
