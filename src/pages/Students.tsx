import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Student } from "../../shared/types";
import { api } from "../api";
import Avatar from "../components/Avatar";
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

  return (
    <>
      <div className="row between">
        <h2>Alunos</h2>
        <Link className="btn primary" to="/alunos/novo">
          + Novo aluno
        </Link>
      </div>
      <input
        type="search"
        placeholder="Buscar por nome ou escola…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <label className="check-line">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Mostrar inativos
      </label>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Carregando…</p>}
      {!loading && visible.length === 0 && <p className="muted">Nenhum aluno encontrado.</p>}

      <ul className="list">
        {visible.map((s) => {
          const age = ageFrom(s.birthDate);
          return (
            <li key={s._id}>
              <Link to={`/alunos/${s._id}`} className={`student-row ${s.active ? "" : "inactive"}`}>
                <Avatar name={s.name} photo={s.photo} />
                <span className="grow">
                  <strong>{s.name}</strong>
                  <small className="muted block">
                    {[age !== null && `${age} anos`, s.school, !s.active && "inativo"]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                <span className="muted">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
