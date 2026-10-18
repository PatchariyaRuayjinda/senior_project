import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from "antd";
import type { User } from "../auth/client";
import { saveProduct } from "./client";
import { EditorModal } from "./EditorModal";
import { HistoryDrawer } from "./HistoryDrawer";
import type { Product, ProductInput } from "./types";

type ProductFields = ProductInput & { active: boolean };
const defaults: ProductFields = {
  sku: "",
  name: "",
  unit: "",
  maxQuantityPerPallet: 100,
  tracksExpiry: false,
  pickingMinimum: 0,
  pickingTarget: 100,
  active: true,
};
const required = [
  { required: true, whitespace: true, message: "กรุณาระบุข้อมูล" },
];

export function ProductsPage({
  products,
  user,
  loading,
  reload,
}: {
  products: Product[];
  user: User;
  loading: boolean;
  reload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState<{ product: Product | null } | null>(
    null,
  );
  const [history, setHistory] = useState<Product | null>(null);
  const { message } = App.useApp();
  const canManage = user.role === "admin";
  const visible = products.filter(
    (product) =>
      `${product.sku} ${product.name}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()) &&
      (status === "all" || product.active === (status === "active")),
  );
  const product = editor?.product ?? null;

  return (
    <>
      <div className="master-data-toolbar">
        <Input.Search
          aria-label="ค้นหาสินค้า"
          placeholder="ค้นหารหัสหรือชื่อสินค้า"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
        />
        <Select
          aria-label="สถานะสินค้า"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "เปิดใช้งาน" },
            { value: "inactive", label: "ปิดใช้งาน" },
          ]}
        />
        {canManage && (
          <Button
            type="primary"
            disabled={loading}
            onClick={() => setEditor({ product: null })}
          >
            เพิ่มสินค้า
          </Button>
        )}
      </div>
      {!canManage && (
        <Alert
          className="master-data-feedback"
          type="info"
          title="คุณดูข้อมูลสินค้าและสร้างล็อตได้ ผู้ดูแลระบบเป็นผู้แก้ไขข้อมูลหลักสินค้า"
          showIcon
        />
      )}
      <Table<Product>
        rowKey="id"
        loading={loading}
        dataSource={visible}
        scroll={{ x: 1050 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: "ยังไม่มีสินค้าที่ตรงกับการค้นหา" }}
        columns={[
          {
            title: "รหัสสินค้า",
            dataIndex: "sku",
            width: 150,
            fixed: "left",
            className: "master-code-cell",
          },
          { title: "ชื่อสินค้า", dataIndex: "name" },
          { title: "หน่วย", dataIndex: "unit", width: 90 },
          {
            title: "ความจุ/พาเลต",
            dataIndex: "maxQuantityPerPallet",
            align: "right",
            width: 125,
          },
          {
            title: "ขั้นต่ำ / เป้าหมายหยิบ",
            render: (_, item) =>
              `${item.pickingMinimum} / ${item.pickingTarget}`,
            align: "right",
            width: 170,
          },
          {
            title: "ติดตามหมดอายุ",
            dataIndex: "tracksExpiry",
            render: (value) => (value ? "ติดตาม" : "ไม่ติดตาม"),
            width: 130,
          },
          {
            title: "สถานะ",
            dataIndex: "active",
            render: (active) => (
              <Tag>{active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Tag>
            ),
            width: 110,
          },
          {
            title: "จัดการ",
            width: 145,
            render: (_, item) => (
              <Space>
                {canManage && (
                  <Button
                    type="link"
                    aria-label={`แก้ไข ${item.sku}`}
                    onClick={() => setEditor({ product: item })}
                  >
                    แก้ไข
                  </Button>
                )}
                <Button
                  type="link"
                  aria-label={`ประวัติ ${item.sku}`}
                  onClick={() => setHistory(item)}
                >
                  ประวัติ
                </Button>
              </Space>
            ),
          },
        ]}
      />
      {editor && (
        <EditorModal<ProductFields>
          key={product?.id ?? "new"}
          title={product ? `แก้ไขสินค้า · ${product.sku}` : "เพิ่มสินค้า"}
          initialValues={
            product
              ? {
                  sku: product.sku,
                  name: product.name,
                  unit: product.unit,
                  maxQuantityPerPallet: product.maxQuantityPerPallet,
                  tracksExpiry: product.tracksExpiry,
                  pickingMinimum: product.pickingMinimum,
                  pickingTarget: product.pickingTarget,
                  active: product.active,
                }
              : defaults
          }
          onSave={(values, key) => saveProduct(values, product, key)}
          onCancel={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            void message.success("บันทึกสินค้าแล้ว");
            void reload();
          }}
        >
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
              <InputNumber
                min={1}
                max={Number.MAX_SAFE_INTEGER}
                precision={0}
              />
            </Form.Item>
            <Form.Item
              name="pickingMinimum"
              label="ยอดขั้นต่ำจุดหยิบ"
              extra="0 หมายถึงไม่เสนอเติมตามขั้นต่ำ"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                precision={0}
              />
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
                      : Promise.reject(
                          new Error("เป้าหมายต้องไม่น้อยกว่าขั้นต่ำ"),
                        ),
                }),
              ]}
            >
              <InputNumber
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                precision={0}
              />
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
        </EditorModal>
      )}
      {history && (
        <HistoryDrawer
          entityType="product"
          id={history.id}
          title={history.sku}
          onClose={() => setHistory(null)}
        />
      )}
    </>
  );
}
