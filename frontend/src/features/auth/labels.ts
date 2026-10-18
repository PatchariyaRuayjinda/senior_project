import type { User } from "./api/client";

export const roleLabel = (role: User["role"]) =>
  role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่คลัง";
