import { route, clearSession } from "../_lib/http.js";

export default route(
  (_req, res) => {
    clearSession(res);
    res.json({ ok: true });
  },
  { public: true },
);
