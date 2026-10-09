import mongoose from "mongoose";
import { route, methodNotAllowed } from "../_lib/http.js";
import { AttendanceModel, StudentModel } from "../_lib/models.js";
import { cleanStudent } from "../_lib/students.js";

export default route(async (req, res) => {
  const id = String(req.query.id);
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

  if (req.method === "GET") {
    const s = await StudentModel.findById(id);
    return s ? res.json(s) : res.status(404).json({ error: "Aluno não encontrado" });
  }
  if (req.method === "PUT") {
    const data = cleanStudent(req.body);
    if (typeof data === "string") return res.status(400).json({ error: data });
    const s = await StudentModel.findByIdAndUpdate(id, data, { new: true });
    return s ? res.json(s) : res.status(404).json({ error: "Aluno não encontrado" });
  }
  if (req.method === "DELETE") {
    await AttendanceModel.deleteMany({ studentId: id });
    await StudentModel.findByIdAndDelete(id);
    return res.json({ ok: true });
  }
  methodNotAllowed(res);
});
