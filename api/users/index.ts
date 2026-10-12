import bcrypt from "bcryptjs";
import { route, methodNotAllowed } from "../_lib/http.js";
import { User } from "../_lib/models.js";

const USERNAME = /^[a-z0-9._-]{3,30}$/;

export default route(async (req, res) => {
  if (req.method === "GET") {
    const users = await User.find().select("username name createdAt").sort({ name: 1 }).collation({ locale: "pt" });
    return res.json(users);
  }

  if (req.method === "POST") {
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 80) : "";
    const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!name) return res.status(400).json({ error: "Informe o nome do professor." });
    if (!USERNAME.test(username)) {
      return res.status(400).json({ error: "Usuário com 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado." });
    }
    // o bcrypt só considera os 72 primeiros bytes da senha
    if (password.length < 8 || Buffer.byteLength(password) > 72) {
      return res.status(400).json({ error: "A senha precisa ter de 8 a 72 caracteres." });
    }
    if (await User.exists({ username })) {
      return res.status(409).json({ error: "Já existe um professor com esse usuário." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, name, passwordHash });
    return res.status(201).json({ _id: user._id, username: user.username, name: user.name });
  }

  methodNotAllowed(res);
});
