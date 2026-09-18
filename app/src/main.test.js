import { afterAll, expect, test } from "bun:test";
import app from "./main.js";

const server = app.listen(0, "127.0.0.1");
const base = `http://127.0.0.1:${server.address().port}`;

afterAll(async () => {
  server.close();
  await new Promise((resolve) => server.close(resolve));
});

test("GET / returns Hello World!", async () => {
  const res = await fetch(`${base}/`);
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("Hello World!");
});

test("GET /health returns OK", async () => {
  const res = await fetch(`${base}/health`);
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("OK");
});
