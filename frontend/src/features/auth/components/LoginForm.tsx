import { Alert, Button, Form, Input } from "antd";
import { useState } from "react";
import { errorMessage, login } from "../api/client";

export function LoginForm({ initialError }: { initialError?: string }) {
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
        <Alert className="login-error" type="error" showIcon title={error} />
      )}
      <Button type="primary" htmlType="submit" loading={busy} block>
        เข้าสู่ระบบ
      </Button>
    </Form>
  );
}
