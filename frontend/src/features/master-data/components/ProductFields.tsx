import { Alert, Form, Input, InputNumber, Switch } from "antd";
import type { Product } from "../types";

const required = [{ required: true, whitespace: true, message: "กรุณาระบุข้อมูล" }];

export function ProductFields({ product }: { product: Product | null }) {
  return (
    <>
      {product?.firstReceivedAt && (
        <Alert
          className="master-data-feedback"
          type="info"
          showIcon
          title="เคยรับเข้าแล้ว รหัส หน่วยนับ และตัวเลือกติดตามหมดอายุจึงถูกล็อก"
        />
      )}
      <div className="master-data-form-grid">
        <Form.Item name="sku" label="รหัสสินค้า" rules={required}>
          <Input maxLength={64} disabled={!!product?.firstReceivedAt} />
        </Form.Item>
        <Form.Item name="name" label="ชื่อสินค้า" rules={required}>
          <Input maxLength={160} />
        </Form.Item>
        <Form.Item name="unit" label="หน่วยนับหลัก" rules={required}>
          <Input maxLength={160} disabled={!!product?.firstReceivedAt} />
        </Form.Item>
        <Form.Item
          name="maxQuantityPerPallet"
          label="ความจุสูงสุดต่อพาเลต"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={Number.MAX_SAFE_INTEGER} precision={0} />
        </Form.Item>
        <Form.Item
          name="pickingMinimum"
          label="ยอดขั้นต่ำจุดหยิบ"
          extra="0 หมายถึงไม่เสนอเติมตามขั้นต่ำ"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} max={Number.MAX_SAFE_INTEGER} precision={0} />
        </Form.Item>
        <Form.Item
          name="pickingTarget"
          label="ยอดเป้าหมายจุดหยิบ"
          dependencies={["pickingMinimum"]}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                value >= getFieldValue("pickingMinimum")
                  ? Promise.resolve()
                  : Promise.reject(new Error("เป้าหมายต้องไม่น้อยกว่าขั้นต่ำ")),
            }),
          ]}
        >
          <InputNumber min={0} max={Number.MAX_SAFE_INTEGER} precision={0} />
        </Form.Item>
        <Form.Item
          name="tracksExpiry"
          label="ติดตามวันหมดอายุ"
          valuePropName="checked"
        >
          <Switch disabled={!!product?.firstReceivedAt} />
        </Form.Item>
        {product && (
          <Form.Item
            name="active"
            label="เปิดใช้งานสินค้า"
            extra="ปิดแล้วจะรับเข้าใหม่ไม่ได้ แต่ยังจัดการของคงเหลือได้"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
      </div>
    </>
  );
}
