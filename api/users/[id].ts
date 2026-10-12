import mongoose from "mongoose";
import { route, methodNotAllowed } from "../_lib/http.js";
import { User } from "../_lib/models.js";

export default route(async (req, res, { userId }) => {
  if (req.method !== "DELETE") return methodNotAllowed(res);

  const id = String(req.query.id);
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });
  if (id === userId) return res.status(400).json({ error: "Você não pode remover o próprio acesso." });

  const removed = await User.findByIdAndDelete(id);
  if (!removed) return res.status(404).json({ error: "Professor não encontrado." });
  res.json({ ok: true });
});
