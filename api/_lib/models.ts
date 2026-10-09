import mongoose, { Schema } from "mongoose";
import { SLOT_IDS } from "../../shared/types.js";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

const studentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    birthDate: { type: String, default: "" },
    school: { type: String, default: "", trim: true },
    guardianName: { type: String, default: "", trim: true },
    guardianPhone: { type: String, default: "", trim: true },
    notes: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const attendanceSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    slot: { type: String, required: true, enum: SLOT_IDS },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
attendanceSchema.index({ studentId: 1, date: 1, slot: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const StudentModel = mongoose.models.Student || mongoose.model("Student", studentSchema);
export const AttendanceModel =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
