import { Typography } from "antd";
import type { ReactNode } from "react";

export function LoginTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="login-shell">
      <section className="login-intro" aria-label="Inventory">
        <a className="brand" href="/" aria-label="Inventory หน้าหลัก">
          inventory.
        </a>
        <div className="intro-copy">
          <Typography.Title>
            ทุกอย่าง
            <br />
            เข้าที่เข้าทาง
          </Typography.Title>
          <Typography.Paragraph>
            พื้นที่สำหรับดูแลคลังสินค้า
            <br />
            เริ่มต้นวันทำงานด้วยการเข้าสู่ระบบของคุณ
          </Typography.Paragraph>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <Typography.Title level={2}>เข้าสู่ระบบ</Typography.Title>
          <Typography.Paragraph type="secondary">
            ยินดีต้อนรับกลับมา ใช้บัญชีที่ได้รับจากผู้ดูแลระบบ
          </Typography.Paragraph>
          {children}
          <Typography.Paragraph className="account-help" type="secondary">
            ต้องการบัญชีผู้ใช้? ติดต่อผู้ดูแลระบบของคุณ
          </Typography.Paragraph>
        </div>
      </section>
    </main>
  );
}
