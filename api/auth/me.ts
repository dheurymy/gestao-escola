import { route } from "../_lib/http.js";
import { User } from "../_lib/models.js";

export default route(async (_req, res, { userId }) => {
  const user = await User.findById(userId).select("username name");
  if (!user) return res.status(401).json({ error: "Não autenticado" });
  res.json(user);
});
