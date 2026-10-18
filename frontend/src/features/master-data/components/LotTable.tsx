import { Table, Typography } from "antd";
import dayjs from "dayjs";
import type { Lot, Product } from "../types";

import { RecordActions } from "../../../components/molecules/RecordActions";

export function LotTable({
  lots,
  loading,
  canManage,
  onEdit,
  onHistory,
  products,
}: {
  lots: Lot[];
  products: Product[];
  loading: boolean;
  canManage: boolean;
  onEdit: (record: Lot) => void;
  onHistory: (record: Lot) => void;
}) {
  const productById = new Map(products.map((product) => [product.id, product]));
  return (
    <Table<Lot>
      rowKey="id"
      loading={loading}
      dataSource={lots}
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
            <RecordActions
              label={item.code}
              onEdit={canManage ? () => onEdit(item) : undefined}
              onHistory={() => onHistory(item)}
              editDisabled={!!item.firstReceivedAt}
            />
          ),
        },
      ]}
    />
  );
}
