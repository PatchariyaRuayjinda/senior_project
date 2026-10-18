import { Alert, Descriptions, Drawer, Empty, Spin, Typography } from "antd";

export interface HistoryEntry {
  id: string;
  action: "created" | "updated";
  actorUsername: string;
  createdAt: string;
  reason?: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
}

const valueLabel = (value: unknown) =>
  value === true
    ? "ใช่"
    : value === false
      ? "ไม่ใช่"
      : value == null
        ? "—"
        : String(value);

export function ChangeHistoryDrawer({
  title,
  onClose,
  events,
  error,
  fields,
}: {
  title: string;
  onClose: () => void;
  events: HistoryEntry[] | null;
  error: string;
  fields: Record<string, string>;
}) {
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
                <Typography.Paragraph>เหตุผล: {event.reason}</Typography.Paragraph>
              )}
              <Descriptions
                column={1}
                size="small"
                items={Object.entries(fields)
                  .filter(
                    ([field]) =>
                      (field in event.after ||
                        (event.before && field in event.before)) &&
                      (!event.before || event.before[field] !== event.after[field]),
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
