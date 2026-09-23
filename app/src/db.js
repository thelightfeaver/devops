import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "devops";

let client;
let connectionPromise;

export async function connectToDatabase() {
  if (!connectionPromise) {
    client = new MongoClient(uri);
    connectionPromise = client.connect();
  }
  await connectionPromise;
  return client;
}

export async function closeDatabase() {
  connectionPromise = undefined;
  if (client) {
    await client.close();
    client = undefined;
  }
}

export function collections() {
  if (!client) {
    throw new Error("Database not connected");
  }
  return {
    todos: client.db(dbName).collection("todos"),
  };
}
