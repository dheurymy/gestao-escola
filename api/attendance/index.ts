import mongoose from "mongoose";
import { route, methodNotAllowed, isDate } from "../_lib/http.js";
import { AttendanceModel } from "../_lib/models.js";
import { SLOT_IDS } from "../../shared/types.js";

export default route(async (req, res, { userId }) => {
  // GET /api/attendance?from=AAAA-MM-DD&to=AAAA-MM-DD[&studentId=...]
  if (req.method === "GET") {
    const { from, to, studentId } = req.query;
    if (!isDate(from) || !isDate(to)) {
      return res.status(400).json({ error: "Informe from e to (AAAA-MM-DD)" });
    }
    const filter: Record<string, unknown> = { date: { $gte: from, $lte: to } };
    if (typeof studentId === "string") {
      if (!mongoose.isValidObjectId(studentId)) return res.status(400).json({ error: "ID inválido" });
      filter.studentId = studentId;
    }
    const rows = await AttendanceModel.find(filter)
      .select("studentId date slot")
      .sort({ date: 1, slot: 1 })
      .lean();
    return res.json(rows);
  }

  // POST { studentId, date, slot, present } -> marca ou desmarca a presença
  if (req.method === "POST") {
    const { studentId, date, slot, present } = req.body ?? {};
    if (!mongoose.isValidObjectId(studentId) || !isDate(date) || !SLOT_IDS.includes(slot)) {
      return res.status(400).json({ error: "Dados inválidos" });
    }
    if (present) {
      await AttendanceModel.updateOne(
        { studentId, date, slot },
        { $setOnInsert: { markedBy: userId } },
        { upsert: true },
      );
    } else {
      await AttendanceModel.deleteOne({ studentId, date, slot });
    }
    return res.json({ ok: true });
  }
  methodNotAllowed(res);
});
