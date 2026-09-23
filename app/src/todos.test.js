import { afterAll, beforeAll, expect, test } from "bun:test";
import express from "express";
import { ObjectId } from "mongodb";

import { todosRouter } from "./todos.js";

function createFakeCollection() {
  const docs = new Map();
  return {
    async info() {
      return { count: docs.size };
    },
    async insertOne(doc) {
      const _id = new ObjectId();
      docs.set(_id.toHexString(), { ...doc, _id });
      return { insertedId: _id };
    },
    find() {
      return {
        async toArray() {
          return [...docs.values()];
        },
      };
    },
    async findOne(query) {
      for (const doc of docs.values()) {
        if (String(doc._id) === String(query._id)) return { ...doc };
      }
      return null;
    },
    async findOneAndUpdate(query, update, opts) {
      const key = String(query._id);
      if (!docs.has(key)) return null;
      const updated = { ...docs.get(key), ...update.$set };
      docs.set(key, updated);
      const result = { ...updated };
      return opts?.includeResultMetadata ? { value: result } : result;
    },
    async deleteOne(query) {
      return { deletedCount: docs.delete(String(query._id)) ? 1 : 0 };
    },
  };
}

const collection = createFakeCollection();
const app = express();
app.use(express.json());
app.use(
  "/todos",
  todosRouter(() => collection)
);
app.use((err, req, res, _next) => {
  res.status(err.status ?? 500).json({ error: err.message ?? "Internal error" });
});

const server = app.listen(0, "127.0.0.1");
const base = `http://127.0.0.1:${server.address().port}`;

afterAll(async () => {
  server.close();
  await new Promise((resolve) => server.close(resolve));
});

const request = async (method, path, body) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

beforeAll(async () => {
  for (const title of ["Buy milk", "Write report", "Exercise"]) {
    await collection.insertOne({ title, description: "", done: false });
  }
});

test("GET /todos lists existing todos", async () => {
  const { status, body } = await request("GET", "/todos");
  expect(status).toBe(200);
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBe(3);
  expect(body[0]).toHaveProperty("title");
  expect(body[0]).toHaveProperty("done");
});

test("POST /todos creates a todo", async () => {
  const { status, body } = await request("POST", "/todos", {
    title: "  Deploy app  ",
    description: "Roll out v1.2",
  });
  expect(status).toBe(201);
  expect(body.title).toBe("Deploy app");
  expect(body.description).toBe("Roll out v1.2");
  expect(body.done).toBe(false);

  const { body: detail } = await request("GET", `/todos/${body._id}`);
  expect(detail.title).toBe("Deploy app");
});

test("POST /todos requires a title", async () => {
  const { status, body } = await request("POST", "/todos", {});
  expect(status).toBe(400);
  expect(body.error).toContain("title");
});

test("GET /todos/:id returns a single todo", async () => {
  const { body: todos } = await request("GET", "/todos");
  const id = todos[0]._id;
  const { status, body } = await request("GET", `/todos/${id}`);
  expect(status).toBe(200);
  expect(body._id).toBe(id);
});

test("GET /todos/:id returns 404 for unknown id", async () => {
  const { status } = await request("GET", `/todos/${new ObjectId().toHexString()}`);
  expect(status).toBe(404);
});

test("GET /todos/:id returns 400 for invalid id", async () => {
  const { status } = await request("GET", "/todos/not-an-objectid");
  expect(status).toBe(400);
});

test("PATCH /todos/:id updates fields and toggles done", async () => {
  const { body: todos } = await request("GET", "/todos");
  const id = todos[0]._id;

  const { status, body } = await request("PATCH", `/todos/${id}`, { done: true });
  expect(status).toBe(200);
  expect(body.done).toBe(true);

  const { body: detail } = await request("GET", `/todos/${id}`);
  expect(detail.done).toBe(true);
  expect(typeof detail.updatedAt).toBe("string");
});

test("PATCH /todos/:id returns 404 for unknown id", async () => {
  const { status } = await request("PATCH", `/todos/${new ObjectId().toHexString()}`, {
    done: true,
  });
  expect(status).toBe(404);
});

test("DELETE /todos/:id removes a todo", async () => {
  const { body: created } = await request("POST", "/todos", { title: "Temp" });
  const { status } = await request("DELETE", `/todos/${created._id}`);
  expect(status).toBe(204);

  const { body: todos } = await request("GET", "/todos");
  expect(todos.some((t) => t._id === created._id)).toBe(false);
});

test("DELETE /todos/:id returns 404 for unknown id", async () => {
  const { status } = await request("DELETE", `/todos/${new ObjectId().toHexString()}`);
  expect(status).toBe(404);
});
