import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { notFound, errorHandler } from "../src/middleware/error.js";

describe("notFound middleware", () => {
  it("returns 404 with a JSON body", async () => {
    const app = express();
    app.use(notFound);
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Not found" });
  });
});

describe("errorHandler middleware", () => {
  let consoleSpy;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("returns the status code attached to the error", async () => {
    const app = express();
    app.get("/bad", (_req, _res, next) => {
      const err = new Error("nope");
      err.statusCode = 422;
      next(err);
    });
    app.use(errorHandler);
    const res = await request(app).get("/bad");
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ message: "nope" });
  });

  it("defaults to status 500 and 'Server error' when nothing is provided", async () => {
    const app = express();
    app.get("/boom", (_req, _res, next) => next(new Error()));
    app.use(errorHandler);
    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });
});
