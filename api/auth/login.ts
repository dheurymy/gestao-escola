import bcrypt from "bcryptjs";
import { route, setSession, methodNotAllowed } from "../_lib/http.js";
import { User } from "../_lib/models.js";

const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8e1mC0nZ1mP2GQ6c1g0s8Yh3eJ0yWa";

export default route(
  async (req, res) => {
    if (req.method !== "POST") return methodNotAllowed(res);
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Informe usuário e senha" });
    }
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    // compara sempre, para não revelar pelo tempo de resposta se o usuário existe
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) return res.status(401).json({ error: "Usuário ou senha inválidos" });
    setSession(res, String(user._id));
    res.json({ _id: user._id, username: user.username, name: user.name });
  },
  { public: true },
);
