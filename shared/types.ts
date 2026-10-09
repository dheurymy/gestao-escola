export const SLOTS = [
  { id: "08-10", label: "8h–10h", shift: "Manhã" },
  { id: "10-12", label: "10h–12h", shift: "Manhã" },
  { id: "14-16", label: "14h–16h", shift: "Tarde" },
  { id: "16-18", label: "16h–18h", shift: "Tarde" },
  { id: "18-20", label: "18h–20h", shift: "Noite" },
] as const;

export type SlotId = (typeof SLOTS)[number]["id"];
export const SLOT_IDS: SlotId[] = SLOTS.map((s) => s.id);

export interface Student {
  _id: string;
  name: string;
  photo: string; // data URL (JPEG reduzido) ou ""
  birthDate: string; // AAAA-MM-DD ou ""
  school: string;
  guardianName: string;
  guardianPhone: string;
  notes: string;
  active: boolean;
}

export type StudentInput = Omit<Student, "_id">;

export interface Attendance {
  _id: string;
  studentId: string;
  date: string; // AAAA-MM-DD
  slot: SlotId;
}

export interface User {
  _id: string;
  username: string;
  name: string;
}
