import express from "express";
import client from "prom-client";

import { closeDatabase, collections, connectToDatabase } from "./db.js";
import { todosRouter } from "./todos.js";

const app = express();
const register = new client.Registry();

client.collectDefaultMetrics({
  app: "devops-app",
  prefix: "devops_app_",
  register,
});

const httpRequestsTotal = new client.Counter({
  name: "devops_app_http_requests_total",
  help: "Total number of HTTP requests processed by the app.",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path ?? req.path ?? "unknown",
      status_code: String(res.statusCode),
    });
  });

  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.use(
  "/todos",
  todosRouter(() => collections().todos)
);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

app.use((err, req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: err.message ?? "Internal Server Error" });
});

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 3000);
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }

  const shutdown = async () => {
    await closeDatabase();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export default app;
