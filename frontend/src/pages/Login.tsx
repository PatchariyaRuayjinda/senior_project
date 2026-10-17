import { useState } from "react";
import { Alert, Button, Form, Input, Typography } from "antd";
import { errorMessage, login } from "../auth/client";

export function Login({ initialError }: { initialError?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  async function submit(values: { username: string; password: string }) {
    setBusy(true);
    setError("");
    try {
      await login(values.username, values.password);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
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
          <Form
            layout="vertical"
            onFinish={submit}
            disabled={busy}
            aria-label="เข้าสู่ระบบ"
            requiredMark={false}
          >
            <Form.Item
              label="ชื่อผู้ใช้"
              name="username"
              rules={[
                { required: true, message: "กรอกชื่อผู้ใช้" },
                { min: 3, message: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" },
              ]}
            >
              <Input
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={64}
                placeholder="กรอกชื่อผู้ใช้"
              />
            </Form.Item>
            <Form.Item
              label="รหัสผ่าน"
              name="password"
              rules={[{ required: true, message: "กรอกรหัสผ่าน" }]}
            >
              <Input.Password
                autoComplete="current-password"
                maxLength={128}
                placeholder="กรอกรหัสผ่าน"
              />
            </Form.Item>
            {error && (
              <Alert
                className="login-error"
                type="error"
                showIcon
                title={error}
              />
            )}
            <Button type="primary" htmlType="submit" loading={busy} block>
              เข้าสู่ระบบ
            </Button>
          </Form>
          <Typography.Paragraph className="account-help" type="secondary">
            ต้องการบัญชีผู้ใช้? ติดต่อผู้ดูแลระบบของคุณ
          </Typography.Paragraph>
        </div>
      </section>
    </main>
  );
}
