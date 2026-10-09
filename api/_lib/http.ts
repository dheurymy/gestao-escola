import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { connectDB } from "./db.js";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET não configurada");
  return s;
}

function readCookie(req: VercelRequest, name: string) {
  const header = req.headers.cookie ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function setSession(res: VercelResponse, userId: string) {
  const token = jwt.sign({ sub: userId }, secret(), { expiresIn: MAX_AGE });
  const secure = process.env.VERCEL_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`,
  );
}

export function clearSession(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function getUserId(req: VercelRequest): string | null {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

type Ctx = { userId: string };
type Handler = (req: VercelRequest, res: VercelResponse, ctx: Ctx) => Promise<unknown> | unknown;

/** Envolve o handler: conecta no banco, exige login (a menos que public) e trata erros. */
export function route(handler: Handler, opts: { public?: boolean } = {}) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await connectDB();
      let userId = "";
      if (!opts.public) {
        const id = getUserId(req);
        if (!id) return res.status(401).json({ error: "Não autenticado" });
        userId = id;
      }
      await handler(req, res, { userId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
}

export const methodNotAllowed = (res: VercelResponse) =>
  res.status(405).json({ error: "Método não permitido" });

export const isDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
