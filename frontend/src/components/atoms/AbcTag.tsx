import { Tag, Typography } from "antd";

export function AbcTag({
  classification,
}: {
  classification: "A" | "B" | "C" | null;
}) {
  return classification ? (
    <Tag className={`abc-tag abc-${classification}`}>{classification}</Tag>
  ) : (
    <Typography.Text type="secondary">—</Typography.Text>
  );
}
