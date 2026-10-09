import { useEffect, useMemo, useState } from "react";
import { SLOTS, type Attendance, type Student } from "../../shared/types";
import { api } from "../api";
import DateNav from "../components/DateNav";
import {
  addDays,
  addMonths,
  eachDay,
  endOfMonth,
  formatDate,
  formatLong,
  formatMonth,
  formatShort,
  startOfMonth,
  startOfWeek,
  today,
} from "../dates";

type Range = "day" | "week" | "month";
type Tab = "period" | "student";

function rangeBounds(range: Range, anchor: string): [string, string] {
  if (range === "day") return [anchor, anchor];
  if (range === "week") {
    const start = startOfWeek(anchor);
    return [start, addDays(start, 6)];
  }
  return [startOfMonth(anchor), endOfMonth(anchor)];
}

function shift(range: Range, anchor: string, dir: 1 | -1) {
  if (range === "day") return addDays(anchor, dir);
  if (range === "week") return addDays(anchor, 7 * dir);
  return addMonths(anchor, dir);
}

function rangeLabel(range: Range, anchor: string, from: string, to: string) {
  if (range === "day") return formatLong(anchor);
  if (range === "week") return `${formatDate(from)} – ${formatDate(to)}`;
  return formatMonth(anchor);
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const text = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const slotLabel = (id: string) => SLOTS.find((s) => s.id === id)?.label ?? id;

export default function Reports() {
  const [tab, setTab] = useState<Tab>("period");
  const [range, setRange] = useState<Range>("week");
  const [anchor, setAnchor] = useState(today());
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Attendance[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [from, to] = rangeBounds(range, anchor);
  const days = useMemo(() => eachDay(from, to), [from, to]);

  useEffect(() => {
    api
      .students()
      .then((all) => {
        setStudents(all);
        setStudentId((cur) => cur || all.find((s) => s.active)?._id || "");
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (tab === "student" && !studentId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .attendance(from, to, tab === "student" ? studentId : undefined)
      .then((r) => !cancelled && setRows(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to, tab, studentId]);

  // "studentId|date" -> lista de horários presentes
  const byStudentDay = useMemo(() => {
    const m = new Map<string, string[]>();
    rows.forEach((r) => {
      const k = `${r.studentId}|${r.date}`;
      m.set(k, [...(m.get(k) ?? []), r.slot]);
    });
    return m;
  }, [rows]);

  const label = rangeLabel(range, anchor, from, to);

  return (
    <>
      <h2>Relatórios</h2>
      <div className="segmented">
        <button className={tab === "period" ? "active" : ""} onClick={() => setTab("period")}>
          Por período
        </button>
        <button className={tab === "student" ? "active" : ""} onClick={() => setTab("student")}>
          Por aluno
        </button>
      </div>
      <div className="segmented small">
        {(["day", "week", "month"] as Range[]).map((r) => (
          <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>
            {{ day: "Dia", week: "Semana", month: "Mês" }[r]}
          </button>
        ))}
      </div>

      <DateNav
        label={label}
        onPrev={() => setAnchor(shift(range, anchor, -1))}
        onNext={() => setAnchor(shift(range, anchor, 1))}
      >
        <button className="link" onClick={() => setAnchor(today())}>
          hoje
        </button>
      </DateNav>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Carregando…</p>}

      {tab === "period" ? (
        <PeriodTable
          range={range}
          days={days}
          students={students}
          rows={rows}
          byStudentDay={byStudentDay}
          label={label}
        />
      ) : (
        <StudentReport
          students={students}
          studentId={studentId}
          setStudentId={setStudentId}
          days={days}
          rows={rows}
          label={label}
        />
      )}
    </>
  );
}

function PeriodTable({
  range,
  days,
  students,
  rows,
  byStudentDay,
  label,
}: {
  range: Range;
  days: string[];
  students: Student[];
  rows: Attendance[];
  byStudentDay: Map<string, string[]>;
  label: string;
}) {
  const withRecords = new Set(rows.map((r) => r.studentId));
  const list = students.filter((s) => s.active || withRecords.has(s._id));
  const cols = range === "day" ? SLOTS.map((s) => ({ key: s.id, head: s.label })) : days.map((d) => ({ key: d, head: d }));

  const cell = (studentId: string, key: string) => {
    if (range === "day") return byStudentDay.get(`${studentId}|${days[0]}`)?.includes(key) ? 1 : 0;
    return byStudentDay.get(`${studentId}|${key}`)?.length ?? 0;
  };
  const total = (studentId: string) => cols.reduce((sum, c) => sum + cell(studentId, c.key), 0);

  function exportCsv() {
    downloadCsv(`frequencia-${days[0]}_${days[days.length - 1]}.csv`, [
      ["Aluno", ...cols.map((c) => (range === "day" ? c.head : formatDate(c.key))), "Total de horários"],
      ...list.map((s) => [s.name, ...cols.map((c) => cell(s._id, c.key)), total(s._id)]),
    ]);
  }

  if (list.length === 0) return <p className="muted">Nenhum aluno cadastrado.</p>;

  return (
    <>
      <div className="row between">
        <span className="muted">
          Cada número é a quantidade de horários (de 2h) em que o aluno esteve presente.
        </span>
        <button className="btn" onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>
      <div className="table-wrap" aria-label={`Frequência ${label}`}>
        <table>
          <thead>
            <tr>
              <th className="sticky">Aluno</th>
              {cols.map((c) => (
                <th key={c.key}>
                  {range === "day" ? (
                    c.head
                  ) : (
                    <>
                      {formatShort(c.key).split(",")[0].replace(".", "")}
                      <br />
                      {c.key.slice(8)}
                    </>
                  )}
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s._id} className={s.active ? "" : "inactive"}>
                <td className="sticky">{s.name}</td>
                {cols.map((c) => {
                  const n = cell(s._id, c.key);
                  return (
                    <td key={c.key} className={n ? "hit" : ""}>
                      {n ? (range === "day" ? "✓" : n) : ""}
                    </td>
                  );
                })}
                <td>
                  <strong>{total(s._id)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StudentReport({
  students,
  studentId,
  setStudentId,
  days,
  rows,
  label,
}: {
  students: Student[];
  studentId: string;
  setStudentId: (id: string) => void;
  days: string[];
  rows: Attendance[];
  label: string;
}) {
  const student = students.find((s) => s._id === studentId);
  const perDay = days
    .map((d) => ({ date: d, slots: rows.filter((r) => r.date === d).map((r) => r.slot) }))
    .filter((d) => d.slots.length > 0);
  const totalSlots = rows.length;

  function exportCsv() {
    if (!student) return;
    downloadCsv(`frequencia-${student.name.replace(/\s+/g, "_")}-${days[0]}_${days[days.length - 1]}.csv`, [
      ["Aluno", "Data", "Horário"],
      ...rows.map((r) => [student.name, formatDate(r.date), slotLabel(r.slot)]),
    ]);
  }

  return (
    <>
      <label>
        Aluno
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
              {s.active ? "" : " (inativo)"}
            </option>
          ))}
        </select>
      </label>

      {student && (
        <>
          <div className="stats">
            <div className="stat">
              <strong>{perDay.length}</strong>
              <span>dias com presença</span>
            </div>
            <div className="stat">
              <strong>{totalSlots}</strong>
              <span>horários (≈ {totalSlots * 2}h)</span>
            </div>
          </div>
          <div className="row between">
            <span className="muted">{label}</span>
            <button className="btn" onClick={exportCsv} disabled={totalSlots === 0}>
              Exportar CSV
            </button>
          </div>
          {perDay.length === 0 ? (
            <p className="muted">Nenhuma presença neste período.</p>
          ) : (
            <ul className="list">
              {perDay.map((d) => (
                <li key={d.date} className="day-row">
                  <strong>{formatShort(d.date)}</strong>
                  <span className="chips">
                    {d.slots.map((s) => (
                      <span key={s} className="chip">
                        {slotLabel(s)}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
