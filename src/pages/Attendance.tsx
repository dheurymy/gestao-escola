import { useCallback, useEffect, useMemo, useState } from "react";
import { SLOTS, type Attendance as AttendanceRow, type SlotId, type Student } from "../../shared/types";
import { api } from "../api";
import Avatar from "../components/Avatar";
import DateNav from "../components/DateNav";
import { addDays, formatLong, today } from "../dates";

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
        setError(e instanceof Error ? e.message : "Não foi possível salvar");
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

  return (
    <>
      <DateNav
        label={formatLong(date)}
        onPrev={() => setDate(addDays(date, -1))}
        onNext={() => setDate(addDays(date, 1))}
      >
        <input
          type="date"
          className="date-input"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
        {date !== today() && (
          <button className="link" onClick={() => setDate(today())}>
            ir para hoje
          </button>
        )}
      </DateNav>

      <div className="slots">
        {SLOTS.map((s) => (
          <button
            key={s.id}
            className={`slot ${slot === s.id ? "active" : ""}`}
            onClick={() => setSlot(s.id)}
          >
            <span>{s.label}</span>
            <small>
              {s.shift} · {countBySlot[s.id] ?? 0}
            </small>
          </button>
        ))}
      </div>

      <div className="row between">
        <input
          className="grow"
          type="search"
          placeholder="Buscar aluno…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="badge">
          {present.size} de {students.length} presentes
        </span>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Carregando alunos…</p>}
      {!loading && students.length === 0 && (
        <p className="muted">Nenhum aluno ativo. Cadastre alunos na aba “Alunos”.</p>
      )}

      <ul className="list">
        {visible.map((s) => {
          const here = present.has(s._id);
          return (
            <li key={s._id}>
              <button className={`student-row ${here ? "present" : ""}`} onClick={() => toggle(s)}>
                <Avatar name={s.name} photo={s.photo} />
                <span className="grow">
                  <strong>{s.name}</strong>
                  {s.school && <small className="muted block">{s.school}</small>}
                </span>
                <span className={`check ${here ? "on" : ""}`}>{here ? "✓" : ""}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
