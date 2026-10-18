import { describe, expect, it } from "vitest";
import {
  analyzeDemo,
  availableSlots,
  confirmRelocation,
  createDemoInventory,
  prepareRelocation,
  sampleRange,
  sampleWithdrawals,
  type Withdrawal,
} from "./model";

describe("sample ABC and relocation workflow", () => {
  it("counts each product once per issued document, respects dates, and leaves no-history products unclassified", () => {
    const state = createDemoInventory();
    const documents: Withdrawal[] = [
      {
        id: "1",
        date: sampleRange[0],
        status: "issued",
        productIds: ["P001", "P001", "P002"],
      },
      { id: "2", date: sampleRange[1], status: "issued", productIds: ["P001"] },
      { id: "3", date: "2026-07-19", status: "issued", productIds: ["P001"] },
      {
        id: "4",
        date: sampleRange[0],
        status: "cancelled",
        productIds: ["P001"],
      },
    ];
    const result = analyzeDemo(state.products, documents, sampleRange);
    expect(result.find((row) => row.id === "P001")?.frequency).toBe(2);
    expect(result.find((row) => row.id === "P002")?.frequency).toBe(1);
    expect(result.find((row) => row.id === "P008")?.classification).toBeNull();
    expect(
      analyzeDemo(state.products, documents, ["2027-01-01", "2027-01-31"]).every(
        (row) => row.classification === null,
      ),
    ).toBe(true);
  });
  it("reproduces the reviewed sample and changes location only after confirmation, preserving quantity", () => {
    const state = createDemoInventory();
    const rows = analyzeDemo(state.products, sampleWithdrawals, sampleRange);
    expect(rows.map((row) => row.frequency)).toEqual([35, 25, 20, 8, 7, 3, 2, 0]);
    expect(rows.map((row) => row.classification)).toEqual([
      "A",
      "A",
      "A",
      "B",
      "B",
      "C",
      "C",
      null,
    ]);
    const row = rows.find((row) => row.id === "P001")!;
    const prepared = prepareRelocation(state, row, "A01", sampleRange);
    expect(prepared.products).toEqual(state.products);
    expect(availableSlots(prepared, "A")).not.toContain("A01");
    expect(() => prepareRelocation(prepared, row, "A03", sampleRange)).toThrow(
      "รอยืนยัน",
    );
    const confirmed = confirmRelocation(prepared, prepared.pending[0]!.id);
    expect(confirmed.products.find((product) => product.id === row.id)).toEqual({
      ...state.products[0],
      location: "A01",
    });
    expect(confirmed.pending).toEqual([]);
    expect(state.products[0]?.location).toBe("C05");
  });
  it("rejects occupied, wrong-zone, and reserved destinations and retains the analysis snapshot", () => {
    const state = createDemoInventory();
    const rows = analyzeDemo(state.products, sampleWithdrawals, sampleRange);
    const paper = rows.find((row) => row.id === "P001")!,
      folder = rows.find((row) => row.id === "P003")!;
    expect(() => prepareRelocation(state, paper, "A02", sampleRange)).toThrow(
      "ช่องปลายทาง",
    );
    expect(() => prepareRelocation(state, paper, "B02", sampleRange)).toThrow(
      "ช่องปลายทาง",
    );
    const prepared = prepareRelocation(state, paper, "A01", sampleRange);
    expect(() => prepareRelocation(prepared, folder, "A01", sampleRange)).toThrow(
      "ช่องปลายทาง",
    );
    expect(prepared.pending[0]?.range).toEqual(sampleRange);
    expect(availableSlots({ ...prepared, pending: [] }, "A")).toContain("A01");
  });
  it("requires review again when stock or destination changes before confirmation", () => {
    const state = createDemoInventory();
    const row = analyzeDemo(state.products, sampleWithdrawals, sampleRange)[0]!;
    const prepared = prepareRelocation(state, row, "A01", sampleRange);
    const changedQuantity = {
      ...prepared,
      products: prepared.products.map((product) =>
        product.id === row.id ? { ...product, quantity: 23 } : product,
      ),
    };
    expect(() =>
      confirmRelocation(changedQuantity, prepared.pending[0]!.id),
    ).toThrow("จำนวนหรือตำแหน่ง");
    const occupied = {
      ...prepared,
      products: prepared.products.map((product) =>
        product.id === "P002" ? { ...product, location: "A01" } : product,
      ),
    };
    expect(() => confirmRelocation(occupied, prepared.pending[0]!.id)).toThrow(
      "ไม่ว่าง",
    );
    expect(() =>
      prepareRelocation(changedQuantity, row, "A03", sampleRange),
    ).toThrow("ข้อมูลสินค้าเปลี่ยน");
  });
});
