import { useEffect, useMemo, useState } from "react";
import { SLOTS, type Attendance, type Student } from "../../shared/types";
import { api } from "../api";
import DateNav from "../components/DateNav";
import Icon from "../components/Icon";
import {
  addDays,
  addMonths,
  capitalize,
  eachDay,
  endOfMonth,
  formatDate,
  formatMonth,
  formatShort,
  isWeekend,
  startOfMonth,
  startOfWeek,
  today,
  weekdayShort,
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
  if (range === "day") return `${capitalize(weekdayShort(anchor))}, ${formatDate(anchor)}`;
  if (range === "week") return `${formatDate(from)} a ${formatDate(to)}`;
  return capitalize(formatMonth(anchor));
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
const heat = (n: number) => (n ? `heat-${Math.min(n, 4)}` : "");

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
    <main id="conteudo" className="page" tabIndex={-1}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Frequência</p>
          <h1 className="h1">Relatórios</h1>
        </div>
      </div>

      <div className="controls-bar">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "period"} className={tab === "period" ? "active" : ""} onClick={() => setTab("period")}>
            Por período
          </button>
          <button role="tab" aria-selected={tab === "student"} className={tab === "student" ? "active" : ""} onClick={() => setTab("student")}>
            Por aluno
          </button>
        </div>
        <div className="chip-row" role="group" aria-label="Intervalo">
          {(["day", "week", "month"] as Range[]).map((r) => (
            <button key={r} className={`chipbtn ${range === r ? "active" : ""}`} aria-pressed={range === r} onClick={() => setRange(r)}>
              {{ day: "Dia", week: "Semana", month: "Mês" }[r]}
            </button>
          ))}
        </div>
      </div>

      <DateNav
        label={label}
        onPrev={() => setAnchor(shift(range, anchor, -1))}
        onNext={() => setAnchor(shift(range, anchor, 1))}
      >
        <button className="btn quiet sm" onClick={() => setAnchor(today())}>
          Hoje
        </button>
      </DateNav>

      {error && (
        <div className="notice error" role="alert" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      {tab === "period" ? (
        <PeriodTable
          range={range}
          days={days}
          students={students}
          rows={rows}
          byStudentDay={byStudentDay}
          loading={loading}
        />
      ) : (
        <StudentReport
          students={students}
          studentId={studentId}
          setStudentId={setStudentId}
          days={days}
          rows={rows}
          label={label}
          loading={loading}
        />
      )}
    </main>
  );
}

function PeriodTable({
  range,
  days,
  students,
  rows,
  byStudentDay,
  loading,
}: {
  range: Range;
  days: string[];
  students: Student[];
  rows: Attendance[];
  byStudentDay: Map<string, string[]>;
  loading: boolean;
}) {
  const withRecords = new Set(rows.map((r) => r.studentId));
  const list = students.filter((s) => s.active || withRecords.has(s._id));
  const cols =
    range === "day"
      ? SLOTS.map((s) => ({ key: s.id as string, head: s.label }))
      : days.map((d) => ({ key: d, head: d }));
  const todayIso = today();

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

  if (!loading && list.length === 0) {
    return (
      <div className="panel">
        <div className="empty">
          <div className="glyph">
            <Icon name="chart" size={24} />
          </div>
          <strong>Sem alunos para mostrar</strong>
          <p>Cadastre alunos e registre presenças para ver a frequência aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="controls-bar">
        <p className="report-note">Cada número é a quantidade de horários de 2h em que o aluno esteve presente.</p>
        <button className="btn sm" onClick={exportCsv} disabled={loading || list.length === 0}>
          <Icon name="download" size={16} />
          Exportar CSV
        </button>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="sticky">Aluno</th>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className={`${range !== "day" && isWeekend(c.key) ? "wk" : ""} ${c.key === todayIso ? "today" : ""}`}
                  >
                    {range === "day" ? (
                      c.head
                    ) : (
                      <>
                        {weekdayShort(c.key)}
                        <b>{c.key.slice(8)}</b>
                      </>
                    )}
                  </th>
                ))}
                <th className="total">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} aria-hidden="true">
                    <td className="sticky">
                      <span className="skeleton" style={{ width: `${60 + i * 8}%`, height: 14 }} />
                    </td>
                    <td colSpan={cols.length + 1}>
                      <span className="skeleton" style={{ width: "100%", height: 14 }} />
                    </td>
                  </tr>
                ))}
              {!loading &&
                list.map((s) => (
                  <tr key={s._id} className={s.active ? "" : "inactive"}>
                    <td className="sticky">{s.name}</td>
                    {cols.map((c) => {
                      const n = cell(s._id, c.key);
                      const weekend = range !== "day" && isWeekend(c.key);
                      return (
                        <td key={c.key} className={`${weekend && !n ? "wk" : ""} ${heat(n)}`}>
                          {n ? (range === "day" ? "✓" : n) : ""}
                        </td>
                      );
                    })}
                    <td className="total">{total(s._id)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
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
  loading,
}: {
  students: Student[];
  studentId: string;
  setStudentId: (id: string) => void;
  days: string[];
  rows: Attendance[];
  label: string;
  loading: boolean;
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
      <div className="toolbar">
        <label className="field" style={{ flex: "1 1 280px", maxWidth: 380 }}>
          <span>Aluno</span>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
                {s.active ? "" : " (inativo)"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {student && (
        <>
          <div className="figures">
            <div className="figure">
              <strong>{loading ? "–" : perDay.length}</strong>
              <span>dias com presença</span>
            </div>
            <div className="figure">
              <strong>{loading ? "–" : totalSlots}</strong>
              <span>horários · cerca de {totalSlots * 2}h</span>
            </div>
            <div style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
              <button className="btn sm" onClick={exportCsv} disabled={totalSlots === 0}>
                <Icon name="download" size={16} />
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="panel">
            {!loading && perDay.length === 0 ? (
              <div className="empty">
                <strong>Nenhuma presença em {label.toLowerCase()}</strong>
                <p>Escolha outro período ou registre a chamada deste aluno.</p>
              </div>
            ) : (
              <ul className="list">
                {perDay.map((d) => (
                  <li key={d.date} className="day-row">
                    <strong>{capitalize(formatShort(d.date))}</strong>
                    <span className="chips">
                      {d.slots.map((s) => (
                        <span key={s} className="chip num">
                          {slotLabel(s)}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}
