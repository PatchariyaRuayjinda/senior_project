import type { LocationKind } from "./types";

export const kindLabels: Record<LocationKind, string> = {
  picking: "พื้นที่หยิบ",
  reserve: "พื้นที่สำรอง",
  temporary: "ช่องพัก",
};
