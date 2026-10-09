// Todas as datas são strings AAAA-MM-DD no fuso local (evita problemas de UTC).

const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => toISO(new Date());

export function addDays(iso: string, n: number) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(iso: string, n: number) {
  const d = fromISO(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

/** Segunda-feira da semana da data. */
export function startOfWeek(iso: string) {
  const d = fromISO(iso);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return toISO(d);
}

export const startOfMonth = (iso: string) => iso.slice(0, 8) + "01";
export function endOfMonth(iso: string) {
  const d = fromISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function eachDay(from: string, to: string) {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

export const formatDate = (iso: string) => fromISO(iso).toLocaleDateString("pt-BR");
export const formatLong = (iso: string) =>
  fromISO(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
export const formatShort = (iso: string) =>
  fromISO(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
export const formatMonth = (iso: string) =>
  fromISO(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export function ageFrom(birthDate: string) {
  if (!birthDate) return null;
  const b = fromISO(birthDate);
  const n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}
