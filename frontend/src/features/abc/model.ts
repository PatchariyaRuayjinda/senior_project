export type AbcClass = "A" | "B" | "C";
export type DateRange = readonly [string, string];
export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
}
export interface Withdrawal {
  id: string;
  date: string;
  status: "issued" | "cancelled";
  productIds: string[];
}
export interface AnalysisRow extends Product {
  frequency: number;
  cumulative: number | null;
  classification: AbcClass | null;
}
export interface Relocation {
  id: string;
  productId: string;
  source: string;
  destination: string;
  quantity: number;
  classification: AbcClass;
  range: DateRange;
}
export interface DemoInventory {
  products: Product[];
  pending: Relocation[];
  nextMove: number;
}
export const sampleRange: DateRange = ["2026-07-20", "2026-10-17"];
export const slots = [
  "A01",
  "A02",
  "A03",
  "A04",
  "B01",
  "B02",
  "B03",
  "B04",
  "B05",
  "C01",
  "C02",
  "C03",
  "C04",
  "C05",
];
export function createDemoInventory(): DemoInventory {
  return {
    products: [
      {
        id: "P001",
        name: "กระดาษ A4 80 แกรม",
        quantity: 24,
        unit: "รีม",
        location: "C05",
      },
      {
        id: "P002",
        name: "ปากกาน้ำเงิน",
        quantity: 120,
        unit: "ด้าม",
        location: "A02",
      },
      {
        id: "P003",
        name: "แฟ้มเอกสาร",
        quantity: 48,
        unit: "เล่ม",
        location: "B03",
      },
      {
        id: "P004",
        name: "เทปใส",
        quantity: 36,
        unit: "ม้วน",
        location: "B01",
      },
      {
        id: "P005",
        name: "ลวดเย็บกระดาษ",
        quantity: 25,
        unit: "กล่อง",
        location: "C02",
      },
      {
        id: "P006",
        name: "ซองเอกสาร",
        quantity: 40,
        unit: "ซอง",
        location: "C01",
      },
      {
        id: "P007",
        name: "คลิปหนีบกระดาษ",
        quantity: 80,
        unit: "ตัว",
        location: "C03",
      },
      {
        id: "P008",
        name: "สมุดบันทึก",
        quantity: 18,
        unit: "เล่ม",
        location: "B04",
      },
    ],
    pending: [],
    nextMove: 1,
  };
}

// 35 example documents, some containing multiple products: 100 product occurrences.
const frequencies = [35, 25, 20, 8, 7, 3, 2];
export const sampleWithdrawals: Withdrawal[] = Array.from({ length: 35 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 6, 20 + Math.round((i * 89) / 34)));
  return {
    id: `W${String(i + 1).padStart(3, "0")}`,
    date: date.toISOString().slice(0, 10),
    status: "issued",
    productIds: frequencies.flatMap((count, index) =>
      i < count ? [`P${String(index + 1).padStart(3, "0")}`] : [],
    ),
  };
});

// Demonstration boundaries only; production thresholds and ties remain undecided.
export function analyzeDemo(
  products: Product[],
  withdrawals: Withdrawal[],
  range: DateRange,
): AnalysisRow[] {
  const counts = new Map<string, number>();
  for (const document of withdrawals) {
    if (
      document.status !== "issued" ||
      document.date < range[0] ||
      document.date > range[1]
    )
      continue;
    for (const id of new Set(document.productIds))
      counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const ranked = products
    .map((product) => ({ ...product, frequency: counts.get(product.id) ?? 0 }))
    .sort((a, b) => b.frequency - a.frequency || a.id.localeCompare(b.id));
  const total = ranked.reduce((sum, row) => sum + row.frequency, 0);
  let cumulative = 0;
  return ranked.map((row) => {
    cumulative += row.frequency;
    const percent = total ? (cumulative / total) * 100 : 0;
    return {
      ...row,
      cumulative: row.frequency ? percent : null,
      classification: row.frequency
        ? percent <= 80
          ? "A"
          : percent <= 95
            ? "B"
            : "C"
        : null,
    };
  });
}
export function needsRelocation(row: AnalysisRow) {
  return row.classification !== null && row.location[0] !== row.classification;
}
export function availableSlots(state: DemoInventory, classification: AbcClass) {
  return slots.filter(
    (slot) =>
      slot[0] === classification &&
      !state.products.some((product) => product.location === slot) &&
      !state.pending.some((move) => move.destination === slot),
  );
}
export function prepareRelocation(
  state: DemoInventory,
  row: AnalysisRow,
  destination: string,
  range: DateRange,
): DemoInventory {
  const product = state.products.find((product) => product.id === row.id);
  if (
    !product ||
    product.location !== row.location ||
    product.quantity !== row.quantity
  )
    throw new Error("ข้อมูลสินค้าเปลี่ยนแล้ว กรุณาเลือกสินค้าอีกครั้ง");
  if (state.pending.some((move) => move.productId === row.id))
    throw new Error("สินค้านี้มีรายการย้ายรอยืนยันอยู่แล้ว");
  if (
    !needsRelocation(row) ||
    !row.classification ||
    !availableSlots(state, row.classification).includes(destination)
  )
    throw new Error("ช่องปลายทางใช้ไม่ได้ กรุณาเลือกช่องว่างในโซนที่แนะนำ");
  const move: Relocation = {
    id: `MOVE-${String(state.nextMove).padStart(3, "0")}`,
    productId: row.id,
    source: product.location,
    destination,
    quantity: product.quantity,
    classification: row.classification,
    range: [...range],
  };
  return {
    ...state,
    pending: [...state.pending, move],
    nextMove: state.nextMove + 1,
  };
}
export function confirmRelocation(
  state: DemoInventory,
  moveId: string,
): DemoInventory {
  const move = state.pending.find((move) => move.id === moveId);
  const product = state.products.find((product) => product.id === move?.productId);
  if (!move || !product) throw new Error("ไม่พบรายการย้าย กรุณาทบทวนรายการอีกครั้ง");
  if (product.location !== move.source || product.quantity !== move.quantity)
    throw new Error("จำนวนหรือตำแหน่งต้นทางเปลี่ยน กรุณายกเลิกรายการแล้วเตรียมใหม่");
  if (
    state.products.some((product) => product.location === move.destination) ||
    state.pending.some(
      (other) => other.id !== move.id && other.destination === move.destination,
    )
  )
    throw new Error("ช่องปลายทางไม่ว่างแล้ว กรุณายกเลิกรายการแล้วเลือกช่องใหม่");
  return {
    ...state,
    products: state.products.map((product) =>
      product.id === move.productId
        ? { ...product, location: move.destination }
        : product,
    ),
    pending: state.pending.filter((other) => other.id !== moveId),
  };
}
