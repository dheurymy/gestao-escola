import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SLOTS } from "../../shared/types";
import { useAuth } from "../auth";
import { Logo } from "../components/Icon";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/chamada" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
      navigate("/chamada", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-side" aria-hidden="true">
        <div className="brand">
          <Logo />
          Gestão Escola
        </div>
        <div>
          <h2 className="login-hero">Cinco horários por dia, uma chamada para cada.</h2>
        </div>
        <ul className="timeline">
          {SLOTS.map((s) => (
            <li key={s.id}>
              <b>{s.label}</b>
              <span>{s.shift}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="login-main">
        <div>
          <div className="brand" style={{ marginBottom: 28 }}>
            <Logo />
            Gestão Escola
          </div>
          <h1 className="h1">Entrar</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            Use o usuário e a senha que você recebeu.
          </p>
        </div>
        <form onSubmit={submit}>
          <label className="field">
            <span>Usuário</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <button className="btn primary" disabled={busy} style={{ minHeight: 48 }}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
