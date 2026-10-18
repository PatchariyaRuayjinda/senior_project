import { cleanup, render, screen } from "@testing-library/react";
import { App, ConfigProvider } from "antd";
import { afterEach, expect, it, vi } from "vitest";
import { HistoryDrawer } from "./HistoryDrawer";
import { loadHistory } from "./client";

vi.mock("./client", () => ({
  loadHistory: vi.fn(),
  masterDataError: () => "โหลดประวัติไม่สำเร็จ",
}));
afterEach(cleanup);

it("shows a cleared manufacturer lot label in history with its original value", async () => {
  vi.mocked(loadHistory).mockResolvedValue({
    events: [
      {
        id: "event-1",
        entityType: "lot",
        entityId: "lot-1",
        action: "updated",
        actorId: "admin-id",
        actorUsername: "warehouse-admin",
        createdAt: "2026-10-18T08:00:00.000Z",
        before: { code: "LOT-1", lotNumber: "LABEL-OLD" },
        after: { code: "LOT-1" },
      },
    ],
  });
  render(
    <ConfigProvider>
      <App>
        <HistoryDrawer
          entityType="lot"
          id="lot-1"
          title="LOT-1"
          onClose={() => {}}
        />
      </App>
    </ConfigProvider>,
  );
  expect(await screen.findByText("LABEL-OLD → —")).toBeTruthy();
  expect(screen.getByText(/warehouse-admin/)).toBeTruthy();
});
