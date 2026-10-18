import { Alert, Form, Modal } from "antd";
import type { ReactNode } from "react";

/** Presentation only: the owner supplies submission state and error messages. */
export function FormDialog<T extends object>({
  title,
  initialValues,
  children,
  saving,
  error,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialValues: T;
  children: ReactNode;
  saving: boolean;
  error: string;
  onSubmit: (values: T) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm<T>();
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
        onFinish={onSubmit}
        disabled={saving}
      >
        {children}
      </Form>
    </Modal>
  );
}
