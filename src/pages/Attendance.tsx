import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SLOTS, type Attendance as AttendanceRow, type SlotId, type Student } from "../../shared/types";
import { api } from "../api";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { addDays, dayTitle, today } from "../dates";

const SHIFTS = ["Manhã", "Tarde", "Noite"] as const;

/** Sugere o horário mais próximo do momento atual. */
function currentSlot(): SlotId {
  const h = new Date().getHours();
  if (h < 10) return "08-10";
  if (h < 12) return "10-12";
  if (h < 16) return "14-16";
  if (h < 18) return "16-18";
  return "18-20";
}

export default function Attendance() {
  const [date, setDate] = useState(today());
  const [slot, setSlot] = useState<SlotId>(currentSlot());
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .students()
      .then((all) => setStudents(all.filter((s) => s.active)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRows([]);
    api
      .attendance(date, date)
      .then((r) => !cancelled && setRows(r))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [date]);

  const present = useMemo(
    () => new Set(rows.filter((r) => r.slot === slot).map((r) => r.studentId)),
    [rows, slot],
  );
  const countBySlot = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach((r) => (m[r.slot] = (m[r.slot] ?? 0) + 1));
    return m;
  }, [rows]);

  const toggle = useCallback(
    async (student: Student) => {
      const nowPresent = !present.has(student._id);
      setError("");
      // atualiza a tela na hora e desfaz se o servidor recusar
      setRows((prev) =>
        nowPresent
          ? [...prev, { _id: `tmp-${student._id}`, studentId: student._id, date, slot }]
          : prev.filter((r) => !(r.studentId === student._id && r.slot === slot)),
      );
      try {
        await api.setPresence(student._id, date, slot, nowPresent);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar a presença.");
        setRows((prev) =>
          nowPresent
            ? prev.filter((r) => !(r.studentId === student._id && r.slot === slot))
            : [...prev, { _id: `tmp-${student._id}`, studentId: student._id, date, slot }],
        );
      }
    },
    [present, date, slot],
  );

  const visible = students.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const { weekday, rest } = dayTitle(date);
  const pct = students.length ? Math.round((present.size / students.length) * 100) : 0;

  return (
    <main id="conteudo" className="page" tabIndex={-1}>
      <div className="attendance">
        <aside className="controls" aria-label="Data e horário">
          <div>
            <p className="eyebrow">Chamada</p>
            <h1 className="h1">
              {weekday},<br />
              <span className="soft">{rest}</span>
            </h1>
            <div className="date-tools">
              <button className="btn icon sm" onClick={() => setDate(addDays(date, -1))} aria-label="Dia anterior">
                <Icon name="prev" size={18} />
              </button>
              <button className="btn icon sm" onClick={() => setDate(addDays(date, 1))} aria-label="Próximo dia">
                <Icon name="next" size={18} />
              </button>
              <input
                type="date"
                className="input"
                aria-label="Escolher data"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
              />
              {date !== today() && (
                <button className="btn quiet sm" onClick={() => setDate(today())}>
                  Hoje
                </button>
              )}
            </div>
          </div>

          <div className="slot-groups" role="group" aria-label="Horário">
            {SHIFTS.map((shift) => (
              <div key={shift} className="slot-group">
                <span className="shift">{shift}</span>
                <div className="chip-row">
                  {SLOTS.filter((s) => s.shift === shift).map((s) => (
                    <button
                      key={s.id}
                      className={`chipbtn ${slot === s.id ? "active" : ""}`}
                      onClick={() => setSlot(s.id)}
                      aria-pressed={slot === s.id}
                    >
                      {s.label}
                      <small className="num" title={`${countBySlot[s.id] ?? 0} presentes`}>
                        {countBySlot[s.id] ?? 0}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="tally" aria-live="polite">
            <div className="tally-figure">
              <strong>{present.size}</strong>
              <span>
                de {students.length} {students.length === 1 ? "aluno" : "alunos"} neste horário
              </span>
            </div>
            <div className="bar" aria-hidden="true">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        </aside>

        <section className="roster" aria-label="Alunos">
          <div className="search">
            <Icon name="search" size={18} />
            <input
              className="input"
              type="search"
              placeholder="Buscar aluno"
              aria-label="Buscar aluno"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}

          <div className="panel">
            {loading && (
              <ul className="list" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i} className="row skel">
                    <span className="skeleton" style={{ width: 48, height: 48, borderRadius: 999 }} />
                    <span className="grow">
                      <span className="skeleton" style={{ width: `${55 + i * 7}%`, height: 14 }} />
                      <span className="skeleton" style={{ width: "38%", height: 11, marginTop: 8 }} />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {!loading && students.length === 0 && (
              <div className="empty">
                <div className="glyph">
                  <Icon name="users" size={24} />
                </div>
                <strong>Nenhum aluno ativo ainda</strong>
                <p>Cadastre os alunos para começar a registrar presenças.</p>
                <Link className="btn primary" to="/alunos/novo">
                  <Icon name="plus" size={18} />
                  Cadastrar aluno
                </Link>
              </div>
            )}

            {!loading && students.length > 0 && visible.length === 0 && (
              <div className="empty">
                <strong>Ninguém com esse nome</strong>
                <p>Confira a grafia ou limpe a busca.</p>
              </div>
            )}

            <ul className="list">
              {visible.map((s) => {
                const here = present.has(s._id);
                return (
                  <li key={s._id}>
                    <button
                      className={`row ${here ? "present" : ""}`}
                      onClick={() => toggle(s)}
                      aria-pressed={here}
                    >
                      <Avatar name={s.name} photo={s.photo} />
                      <span className="grow">
                        <span className="name">{s.name}</span>
                        {s.school && <span className="meta">{s.school}</span>}
                      </span>
                      <span className="tick">
                        <Icon name="check" size={18} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
