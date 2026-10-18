import { useState } from "react";
import {
  Alert,
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import dayjs from "dayjs";
import type { User } from "../auth/client";
import { saveLot } from "./client";
import { EditorModal } from "./EditorModal";
import { HistoryDrawer } from "./HistoryDrawer";
import type { Lot, LotInput, Product } from "./types";

function CalendarField({
  value,
  onChange,
  id,
}: {
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
}) {
  return (
    <DatePicker
      id={id}
      value={value ? dayjs(value) : null}
      onChange={(date) => onChange?.(date?.format("YYYY-MM-DD") ?? "")}
      format="DD/MM/YYYY"
    />
  );
}

function LotFields({
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
          <CalendarField />
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
          <CalendarField />
        </Form.Item>
      </div>
      <Typography.Paragraph type="secondary">
        วันที่อ้างอิงตามวันปฏิทินไทย สินค้าใช้ได้ตลอดวันที่ระบุ
        และเบิกไม่ได้ตั้งแต่วันถัดไป
      </Typography.Paragraph>
    </>
  );
}

export function LotsPage({
  lots,
  products,
  user,
  loading,
  reload,
}: {
  lots: Lot[];
  products: Product[];
  user: User;
  loading: boolean;
  reload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ lot: Lot | null } | null>(null);
  const [history, setHistory] = useState<Lot | null>(null);
  const { message } = App.useApp();
  const productById = new Map(products.map((product) => [product.id, product]));
  const visible = lots.filter((lot) =>
    `${lot.code} ${lot.lotNumber ?? ""} ${productById.get(lot.productId)?.sku ?? ""} ${productById.get(lot.productId)?.name ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const lot = editor?.lot ?? null;
  return (
    <>
      <div className="master-data-toolbar">
        <Input.Search
          aria-label="ค้นหาล็อต"
          placeholder="ค้นหารหัสล็อต เลขบนฉลาก หรือสินค้า"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
        />
        <Button
          type="primary"
          disabled={loading || !products.some((product) => product.active)}
          onClick={() => setEditor({ lot: null })}
        >
          สร้างล็อต
        </Button>
      </div>
      <Alert
        className="master-data-feedback"
        type="info"
        showIcon
        title="เลขล็อตบนฉลากซ้ำกันได้ ให้เลือกรหัสล็อตภายในและวันที่ให้ตรงกับของจริง การสร้างล็อตยังไม่เพิ่มสต็อก"
      />
      <Table<Lot>
        rowKey="id"
        loading={loading}
        dataSource={visible}
        scroll={{ x: 1050 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: "ยังไม่มีล็อตที่ตรงกับการค้นหา" }}
        columns={[
          {
            title: "สินค้า",
            width: 200,
            render: (_, item) => (
              <>
                <Typography.Text strong>
                  {productById.get(item.productId)?.sku}
                </Typography.Text>
                <br />
                {productById.get(item.productId)?.name}
              </>
            ),
          },
          {
            title: "รหัสล็อตภายใน",
            dataIndex: "code",
            width: 300,
            render: (code) => (
              <Typography.Text className="lot-code" copyable>
                {code}
              </Typography.Text>
            ),
          },
          {
            title: "เลขบนฉลาก",
            dataIndex: "lotNumber",
            render: (value) => value || "ไม่มีเลขจากผู้ผลิต",
            width: 170,
          },
          {
            title: "วันผลิต",
            dataIndex: "manufacturedAt",
            render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "—"),
            width: 120,
          },
          {
            title: "วันหมดอายุ",
            dataIndex: "expiresAt",
            render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "—"),
            width: 120,
          },
          {
            title: "จัดการ",
            width: 150,
            render: (_, item) => (
              <Space>
                {user.role === "admin" && (
                  <Button
                    type="link"
                    disabled={!!item.firstReceivedAt}
                    aria-label={`แก้ไข ${item.code}`}
                    onClick={() => setEditor({ lot: item })}
                  >
                    แก้ไข
                  </Button>
                )}
                <Button
                  type="link"
                  aria-label={`ประวัติ ${item.code}`}
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
        <EditorModal<LotInput>
          key={lot?.id ?? "new"}
          title={lot ? "แก้ไขล็อตที่ยังไม่รับเข้า" : "สร้างล็อต"}
          initialValues={
            lot
              ? {
                  productId: lot.productId,
                  lotNumber: lot.lotNumber ?? "",
                  manufacturedAt: lot.manufacturedAt ?? "",
                  expiresAt: lot.expiresAt ?? "",
                }
              : {
                  productId: "",
                  lotNumber: "",
                  manufacturedAt: "",
                  expiresAt: "",
                }
          }
          onSave={(values, key) => saveLot(values, lot, key)}
          onCancel={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            void message.success("บันทึกล็อตแล้ว");
            void reload();
          }}
        >
          <LotFields products={products} editing={!!lot} />
        </EditorModal>
      )}
      {history && (
        <HistoryDrawer
          entityType="lot"
          id={history.id}
          title={history.code}
          onClose={() => setHistory(null)}
        />
      )}
    </>
  );
}
