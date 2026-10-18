import { Tag } from "antd";

export function ActiveStatusTag({ active }: { active: boolean }) {
  return <Tag>{active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Tag>;
}
