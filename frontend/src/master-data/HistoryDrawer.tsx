import { useEffect, useState } from "react";
import { Alert, Descriptions, Drawer, Empty, Spin, Typography } from "antd";
import { loadHistory, masterDataError } from "./client";
import type { EntityType, InventoryEvent } from "./types";

const fieldLabels: Record<string, string> = {
  sku: "รหัสสินค้า",
  name: "ชื่อสินค้า",
  unit: "หน่วยนับ",
  maxQuantityPerPallet: "ความจุต่อพาเลต",
  tracksExpiry: "ติดตามหมดอายุ",
  pickingMinimum: "ขั้นต่ำจุดหยิบ",
  pickingTarget: "เป้าหมายจุดหยิบ",
  active: "เปิดใช้งาน",
  code: "รหัส",
  lotNumber: "เลขล็อตบนฉลาก",
  manufacturedAt: "วันผลิต",
  expiresAt: "วันหมดอายุ",
  kind: "ประเภทพื้นที่",
  zone: "โซน",
  inboundBlocked: "ระงับรับเข้า",
  outboundBlocked: "ระงับนำออก",
  blockReason: "เหตุผลระงับล่าสุด",
};
const valueLabel = (value: unknown) =>
  value === true
    ? "ใช่"
    : value === false
      ? "ไม่ใช่"
      : value == null
        ? "—"
        : String(value);

export function HistoryDrawer({
  entityType,
  id,
  title,
  onClose,
}: {
  entityType: EntityType;
  id: string;
  title: string;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<InventoryEvent[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setEvents(null);
    setError("");
    loadHistory(entityType, id)
      .then((result) => {
        if (active) setEvents(result.events);
      })
      .catch((failure) => {
        if (active) setError(masterDataError(failure));
      });
    return () => {
      active = false;
    };
  }, [entityType, id]);
  return (
    <Drawer
      title={`ประวัติ · ${title}`}
      open
      onClose={onClose}
      size={520}
      className="master-data-history"
    >
      {error ? (
        <Alert type="error" title={error} showIcon />
      ) : !events ? (
        <Spin aria-label="กำลังโหลดประวัติ" />
      ) : !events.length ? (
        <Empty description="ยังไม่มีการเปลี่ยนแปลง" />
      ) : (
        <ol className="history-events">
          {events.map((event) => (
            <li key={event.id} className="history-event">
              <Typography.Text strong>
                {event.action === "created" ? "สร้างข้อมูล" : "แก้ไขข้อมูล"}
              </Typography.Text>
              <Typography.Paragraph type="secondary">
                {new Date(event.createdAt).toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                })}{" "}
                · {event.actorUsername}
              </Typography.Paragraph>
              {event.reason && (
                <Typography.Paragraph>
                  เหตุผล: {event.reason}
                </Typography.Paragraph>
              )}
              <Descriptions
                column={1}
                size="small"
                items={Object.entries(fieldLabels)
                  .filter(
                    ([field]) =>
                      (field in event.after ||
                        (event.before && field in event.before)) &&
                      (!event.before ||
                        event.before[field] !== event.after[field]),
                  )
                  .map(([field, label]) => ({
                    key: field,
                    label,
                    children: event.before
                      ? `${valueLabel(event.before[field])} → ${valueLabel(event.after[field])}`
                      : valueLabel(event.after[field]),
                  }))}
              />
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}
