import { Descriptions, Space, Tag, Typography } from "antd";
import type { User } from "../api/client";
import { roleLabel } from "../labels";

export function AccountPanel({ user }: { user: User }) {
  return (
    <section className="account-section" aria-label="ข้อมูลบัญชี">
      <Space className="account-title">
        <Typography.Title level={2}>ข้อมูลบัญชี</Typography.Title>
        <Tag className="status-aligned">เข้าสู่ระบบแล้ว</Tag>
      </Space>
      <Descriptions
        column={1}
        items={[
          {
            key: "username",
            label: "ชื่อผู้ใช้",
            children: user.username,
          },
          {
            key: "role",
            label: "สิทธิ์การใช้งาน",
            children: roleLabel(user.role),
          },
        ]}
      />
    </section>
  );
}
