import mongoose from "mongoose";

// Reaproveita a conexão entre execuções da função serverless.
const g = globalThis as unknown as {
  _mongo?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};
const cache = (g._mongo ??= { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada");
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
  cache.conn = await cache.promise;
  return cache.conn;
}
