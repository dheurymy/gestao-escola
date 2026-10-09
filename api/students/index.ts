import { route, methodNotAllowed } from "../_lib/http.js";
import { StudentModel } from "../_lib/models.js";
import { cleanStudent } from "../_lib/students.js";

export default route(async (req, res) => {
  if (req.method === "GET") {
    const students = await StudentModel.find().sort({ name: 1 }).collation({ locale: "pt" });
    return res.json(students);
  }
  if (req.method === "POST") {
    const data = cleanStudent(req.body);
    if (typeof data === "string") return res.status(400).json({ error: data });
    const student = await StudentModel.create(data);
    return res.status(201).json(student);
  }
  methodNotAllowed(res);
});
