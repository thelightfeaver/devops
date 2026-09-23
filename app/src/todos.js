import { Router } from "express";
import { ObjectId } from "mongodb";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    throw new HttpError(400, "Invalid todo id");
  }
}

export function todosRouter(getCollection) {
  const router = Router();

  router.get("/", async (req, res) => {
    const todos = await getCollection().find().toArray();
    res.json(todos);
  });

  router.post("/", async (req, res) => {
    const { title, description } = req.body ?? {};
    if (typeof title !== "string" || title.trim() === "") {
      throw new HttpError(400, "title is required");
    }
    const now = new Date();
    const todo = {
      title: title.trim(),
      description: typeof description === "string" ? description : "",
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    const { insertedId } = await getCollection().insertOne(todo);
    res.status(201).json({ ...todo, _id: insertedId });
  });

  router.get("/:id", async (req, res) => {
    const todo = await getCollection().findOne({ _id: parseId(req.params.id) });
    if (!todo) {
      throw new HttpError(404, "Todo not found");
    }
    res.json(todo);
  });

  router.patch("/:id", async (req, res) => {
    const { title, description, done } = req.body ?? {};
    const update = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (done !== undefined) update.done = Boolean(done);

    const todo = await getCollection().findOneAndUpdate(
      { _id: parseId(req.params.id) },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!todo) {
      throw new HttpError(404, "Todo not found");
    }
    res.json(todo);
  });

  router.delete("/:id", async (req, res) => {
    const { deletedCount } = await getCollection().deleteOne({
      _id: parseId(req.params.id),
    });
    if (!deletedCount) {
      throw new HttpError(404, "Todo not found");
    }
    res.status(204).end();
  });

  return router;
}
