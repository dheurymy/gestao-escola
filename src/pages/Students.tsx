import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Student } from "../../shared/types";
import { api } from "../api";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { ageFrom } from "../dates";

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .students()
      .then(setStudents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const q = query.toLowerCase();
  const visible = students.filter(
    (s) =>
      (showInactive || s.active) &&
      (s.name.toLowerCase().includes(q) || s.school.toLowerCase().includes(q)),
  );
  const inactiveCount = students.filter((s) => !s.active).length;

  return (
    <main id="conteudo" className="page narrow" tabIndex={-1}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1 className="h1">Alunos</h1>
        </div>
        <Link className="btn primary" to="/alunos/novo">
          <Icon name="plus" size={18} />
          Novo aluno
        </Link>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input
            className="input"
            type="search"
            placeholder="Buscar por nome ou escola"
            aria-label="Buscar aluno"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {inactiveCount > 0 && (
          <label className="check-line">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Mostrar inativos ({inactiveCount})
          </label>
        )}
      </div>

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {!loading && visible.length > 0 && (
        <p className="count num">
          {visible.length} {visible.length === 1 ? "aluno" : "alunos"}
        </p>
      )}

      <div className="panel">
        {loading && (
          <ul className="list" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="row skel">
                <span className="skeleton" style={{ width: 48, height: 48, borderRadius: 999 }} />
                <span className="grow">
                  <span className="skeleton" style={{ width: `${50 + i * 8}%`, height: 14 }} />
                  <span className="skeleton" style={{ width: "34%", height: 11, marginTop: 8 }} />
                </span>
              </li>
            ))}
          </ul>
        )}

        {!loading && visible.length === 0 && (
          <div className="empty">
            <div className="glyph">
              <Icon name="users" size={24} />
            </div>
            {students.length === 0 ? (
              <>
                <strong>Nenhum aluno cadastrado</strong>
                <p>Comece pelo primeiro aluno. Foto, escola e responsável são opcionais.</p>
                <Link className="btn primary" to="/alunos/novo">
                  <Icon name="plus" size={18} />
                  Cadastrar aluno
                </Link>
              </>
            ) : (
              <>
                <strong>Nenhum resultado</strong>
                <p>Tente outro nome ou escola.</p>
              </>
            )}
          </div>
        )}

        <ul className="list">
          {visible.map((s) => {
            const age = ageFrom(s.birthDate);
            return (
              <li key={s._id}>
                <Link to={`/alunos/${s._id}`} className={`row ${s.active ? "" : "inactive"}`}>
                  <Avatar name={s.name} photo={s.photo} />
                  <span className="grow">
                    <span className="name">{s.name}</span>
                    <span className="meta">
                      {[age !== null && `${age} anos`, s.school, !s.active && "inativo"].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="chev">
                    <Icon name="chevron" size={18} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
