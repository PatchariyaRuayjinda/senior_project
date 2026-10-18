import { Table } from "antd";
import type { Product } from "../types";

import { ActiveStatusTag } from "../../../components/atoms/ActiveStatusTag";
import { RecordActions } from "../../../components/molecules/RecordActions";

export function ProductTable({
  products,
  loading,
  canManage,
  onEdit,
  onHistory,
}: {
  products: Product[];
  loading: boolean;
  canManage: boolean;
  onEdit: (record: Product) => void;
  onHistory: (record: Product) => void;
}) {
  return (
    <Table<Product>
      rowKey="id"
      loading={loading}
      dataSource={products}
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
          render: (_, item) => `${item.pickingMinimum} / ${item.pickingTarget}`,
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
          render: (active) => <ActiveStatusTag active={active} />,
          width: 110,
        },
        {
          title: "จัดการ",
          width: 145,
          render: (_, item) => (
            <RecordActions
              label={item.sku}
              onEdit={canManage ? () => onEdit(item) : undefined}
              onHistory={() => onHistory(item)}
            />
          ),
        },
      ]}
    />
  );
}
