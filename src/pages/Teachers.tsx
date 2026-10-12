import { useEffect, useState, type FormEvent } from "react";
import type { User } from "../../shared/types";
import { api } from "../api";
import { useAuth } from "../auth";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

const EMPTY = { name: "", username: "", password: "" };

export default function Teachers() {
  const { user: me } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = () =>
    api
      .teachers()
      .then(setTeachers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const t = await api.createTeacher(form);
      setCreated(t.name);
      setForm(EMPTY);
      setAdding(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível cadastrar o professor.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await api.deleteTeacher(id);
      setConfirmId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover o professor.");
      setConfirmId(null);
    }
  }

  return (
    <main id="conteudo" className="page narrow" tabIndex={-1}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Acesso</p>
          <h1 className="h1">Professores</h1>
        </div>
        {!adding && (
          <button
            className="btn primary"
            onClick={() => {
              setAdding(true);
              setCreated("");
            }}
          >
            <Icon name="plus" size={18} />
            Novo professor
          </button>
        )}
      </div>

      {created && (
        <div className="notice success" role="status" style={{ marginBottom: 16 }}>
          {created} já pode entrar com o usuário e a senha cadastrados. Combine a senha com a pessoa fora do sistema.
        </div>
      )}

      {adding && (
        <form className="subform" onSubmit={submit}>
          <h2 className="h3">Cadastrar professor</h2>
          <label className="field">
            <span>Nome completo</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </label>
          <div className="two">
            <label className="field">
              <span>Usuário</span>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoCapitalize="none"
                autoComplete="off"
                required
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          </div>
          <p className="hint">Usuário em minúsculas, sem espaços. A senha precisa de pelo menos 8 caracteres.</p>
          {formError && (
            <div className="notice error" role="alert">
              {formError}
            </div>
          )}
          <div className="actions">
            <button className="btn primary" disabled={busy}>
              {busy ? "Cadastrando…" : "Cadastrar"}
            </button>
            <button
              type="button"
              className="btn quiet"
              onClick={() => {
                setAdding(false);
                setForm(EMPTY);
                setFormError("");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="notice error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && teachers.length > 0 && (
        <p className="count num">
          {teachers.length} {teachers.length === 1 ? "professor" : "professores"}
        </p>
      )}

      <div className="panel">
        {loading && (
          <ul className="list" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="row skel">
                <span className="skeleton" style={{ width: 48, height: 48, borderRadius: 999 }} />
                <span className="grow">
                  <span className="skeleton" style={{ width: `${45 + i * 10}%`, height: 14 }} />
                  <span className="skeleton" style={{ width: "28%", height: 11, marginTop: 8 }} />
                </span>
              </li>
            ))}
          </ul>
        )}

        <ul className="list">
          {teachers.map((t) => {
            const isMe = t._id === me?._id;
            return (
              <li key={t._id} className="row static">
                <Avatar name={t.name} />
                <span className="grow">
                  <span className="name">
                    {t.name}
                    {isMe && <span className="tag">você</span>}
                  </span>
                  <span className="meta">@{t.username}</span>
                </span>
                {!isMe &&
                  (confirmId === t._id ? (
                    <span className="actions">
                      <button className="btn danger solid sm" onClick={() => remove(t._id)}>
                        Remover
                      </button>
                      <button className="btn quiet sm" onClick={() => setConfirmId(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button className="btn danger sm" onClick={() => setConfirmId(t._id)}>
                      Remover
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      </div>

      {!loading && teachers.length > 0 && (
        <p className="hint" style={{ marginTop: 20 }}>
          Quem for removido perde o acesso imediatamente. As presenças já registradas continuam no histórico.
        </p>
      )}
    </main>
  );
}
