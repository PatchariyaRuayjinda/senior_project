import { Form, Input, Select, Typography } from "antd";
import type { Product } from "../types";

import { CalendarInput } from "../../../components/atoms/CalendarInput";

export function LotFields({
  products,
  editing,
}: {
  products: Product[];
  editing: boolean;
}) {
  const productId = Form.useWatch<string>("productId");
  const tracksExpiry = products.find(
    (product) => product.id === productId,
  )?.tracksExpiry;
  return (
    <>
      <Form.Item
        name="productId"
        label="สินค้า"
        rules={[{ required: true, message: "กรุณาเลือกสินค้า" }]}
      >
        <Select
          aria-label="สินค้า"
          showSearch
          optionFilterProp="label"
          disabled={editing}
          options={products
            .filter((product) => product.active || editing)
            .map((product) => ({
              value: product.id,
              label: `${product.sku} · ${product.name}`,
            }))}
        />
      </Form.Item>
      <Form.Item
        name="lotNumber"
        label="เลขล็อตบนฉลากผู้ผลิต"
        extra="เว้นว่างได้หากไม่มีเลขบนฉลาก ระบบจะสร้างรหัสล็อตภายในให้"
      >
        <Input maxLength={160} />
      </Form.Item>
      <div className="master-data-form-grid">
        <Form.Item name="manufacturedAt" label="วันผลิต">
          <CalendarInput />
        </Form.Item>
        <Form.Item
          name="expiresAt"
          label="วันหมดอายุ"
          dependencies={["manufacturedAt", "productId"]}
          rules={[
            {
              required: !!tracksExpiry,
              message: "สินค้านี้ต้องระบุวันหมดอายุ",
            },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value ||
                !getFieldValue("manufacturedAt") ||
                value >= getFieldValue("manufacturedAt")
                  ? Promise.resolve()
                  : Promise.reject(new Error("วันหมดอายุต้องไม่ก่อนวันผลิต")),
            }),
          ]}
        >
          <CalendarInput />
        </Form.Item>
      </div>
      <Typography.Paragraph type="secondary">
        วันที่อ้างอิงตามวันปฏิทินไทย สินค้าใช้ได้ตลอดวันที่ระบุ
        และเบิกไม่ได้ตั้งแต่วันถัดไป
      </Typography.Paragraph>
    </>
  );
}
