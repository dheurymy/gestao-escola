import type { Attendance, SlotId, Student, StudentInput, User } from "../shared/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Erro ao falar com o servidor", res.status);
  return data as T;
}

export const api = {
  me: () => request<User>("GET", "/api/auth/me"),
  login: (username: string, password: string) =>
    request<User>("POST", "/api/auth/login", { username, password }),
  logout: () => request<{ ok: true }>("POST", "/api/auth/logout"),

  teachers: () => request<User[]>("GET", "/api/users"),
  createTeacher: (t: { name: string; username: string; password: string }) =>
    request<User>("POST", "/api/users", t),
  deleteTeacher: (id: string) => request<{ ok: true }>("DELETE", `/api/users/${id}`),

  students: () => request<Student[]>("GET", "/api/students"),
  student: (id: string) => request<Student>("GET", `/api/students/${id}`),
  createStudent: (s: StudentInput) => request<Student>("POST", "/api/students", s),
  updateStudent: (id: string, s: StudentInput) => request<Student>("PUT", `/api/students/${id}`, s),
  deleteStudent: (id: string) => request<{ ok: true }>("DELETE", `/api/students/${id}`),

  attendance: (from: string, to: string, studentId?: string) =>
    request<Attendance[]>(
      "GET",
      `/api/attendance?from=${from}&to=${to}${studentId ? `&studentId=${studentId}` : ""}`,
    ),
  setPresence: (studentId: string, date: string, slot: SlotId, present: boolean) =>
    request<{ ok: true }>("POST", "/api/attendance", { studentId, date, slot, present }),
};
