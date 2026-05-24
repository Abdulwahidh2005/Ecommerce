import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";

import client from "prom-client";

import { connectDb } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";

const app = express();

const register = new client.Registry();
register.setDefaultLabels({ app: "ecommerce-backend" });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route = req.route?.path || req.baseUrl || req.path || "unknown";
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// #region agent log
const debugLog = (payload) =>
  fetch("http://127.0.0.1:7939/ingest/a68c5c44-a7bc-4798-8f88-4b0ca584305d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "73de6c",
    },
    body: JSON.stringify({
      sessionId: "73de6c",
      runId: "startup-debug",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
// #endregion

process.on("uncaughtException", (err) => {
  // #region agent log
  debugLog({
    hypothesisId: "H5",
    location: "server.js:uncaughtException",
    message: "Uncaught exception during backend runtime",
    data: { name: err?.name, message: err?.message },
  });
  // #endregion
});

process.on("unhandledRejection", (reason) => {
  // #region agent log
  debugLog({
    hypothesisId: "H5",
    location: "server.js:unhandledRejection",
    message: "Unhandled promise rejection during backend runtime",
    data: { reason: String(reason) },
  });
  // #endregion
});

// #region agent log
debugLog({
  hypothesisId: "H1",
  location: "server.js:beforeConnectDb",
  message: "Starting DB connection",
  data: { hasMongoUri: Boolean(process.env.MONGODB_URI) },
});
// #endregion
await connectDb();
// #region agent log
debugLog({
  hypothesisId: "H1",
  location: "server.js:afterConnectDb",
  message: "DB connection succeeded",
  data: {},
});
// #endregion

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
// #region agent log
debugLog({
  hypothesisId: "H3",
  location: "server.js:beforeSessionSetup",
  message: "Configuring session middleware",
  data: {
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  },
});
// #endregion
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 7
    }),
    cookie: {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24 * 7
    },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.use(express.static(publicDir));
app.get(/^\/(?!api|metrics).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // #region agent log
  debugLog({
    hypothesisId: "H4",
    location: "server.js:listenCallback",
    message: "Express server is listening",
    data: { port },
  });
  // #endregion
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

