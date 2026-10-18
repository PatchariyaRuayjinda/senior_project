import { useRef, useState, type ReactNode } from "react";
import { Alert, Form, Modal } from "antd";
import { masterDataError } from "./client";

interface Props<T extends object> {
  title: string;
  initialValues: T;
  children: ReactNode;
  onSave: (values: T, key: string) => Promise<unknown>;
  onSaved: () => void;
  onCancel: () => void;
}

export function EditorModal<T extends object>({
  title,
  initialValues,
  children,
  onSave,
  onSaved,
  onCancel,
}: Props<T>) {
  const [form] = Form.useForm<T>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef<{ body: string; key: string } | null>(null);

  async function submit(values: T) {
    if (saving) return;
    const body = JSON.stringify(values);
    if (attempt.current?.body !== body)
      attempt.current = { body, key: crypto.randomUUID() };
    setSaving(true);
    setError("");
    try {
      await onSave(values, attempt.current.key);
      onSaved();
    } catch (failure) {
      setError(masterDataError(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={title}
      open
      onCancel={saving ? undefined : onCancel}
      onOk={() => form.submit()}
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={saving}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
      width={640}
    >
      {error && (
        <Alert
          className="master-data-feedback"
          type="error"
          showIcon
          title={error}
        />
      )}
      <Form<T>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={submit}
        disabled={saving}
      >
        {children}
      </Form>
    </Modal>
  );
}
