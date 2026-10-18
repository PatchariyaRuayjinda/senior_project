import { Button, Empty, Table, Tag, Typography, type TableColumnsType } from "antd";
import { needsRelocation, type AnalysisRow, type Relocation } from "../model";

import { AbcTag } from "../../../components/atoms/AbcTag";

const { Text } = Typography;

function StatusTag({ row, pending }: { row: AnalysisRow; pending?: Relocation }) {
  if (pending) return <Tag className="status-pending">รอยืนยันย้าย</Tag>;
  if (!row.classification) return <Tag className="status-neutral">ไม่มีประวัติ</Tag>;
  return needsRelocation(row) ? (
    <Tag className="status-warning">ควรย้าย</Tag>
  ) : (
    <Tag className="status-aligned">ตรงโซนแล้ว</Tag>
  );
}

export function AbcAnalysisTable({
  rows,
  selectedId,
  mobile,
  pendingByProduct,
  onSelect,
  filter,
  onShowAll,
}: {
  rows: AnalysisRow[];
  selectedId: string;
  mobile: boolean;
  pendingByProduct: Map<string, Relocation>;
  onSelect: (row: AnalysisRow) => void;
  filter: "all" | "mismatch" | "pending";
  onShowAll: () => void;
}) {
  const columns: TableColumnsType<AnalysisRow> = [
    { title: "รหัส", dataIndex: "id", width: 76, responsive: ["xl"] },
    {
      title: "สินค้า",
      dataIndex: "name",
      width: undefined,
      render: (_, row) => (
        <div className="product-cell">
          <Button type="link" className="product-link" onClick={() => onSelect(row)}>
            {row.name}
          </Button>
          <Text className="mobile-product-code" type="secondary">
            {row.id}
          </Text>
          {mobile && (
            <div className="mobile-product-status">
              <StatusTag row={row} pending={pendingByProduct.get(row.id)} />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "เบิก (ครั้ง)",
      dataIndex: "frequency",
      width: 86,
      align: "right",
      responsive: ["lg"],
    },
    {
      title: "ABC",
      dataIndex: "classification",
      width: 58,
      render: (classification) => <AbcTag classification={classification} />,
    },
    { title: "ช่องปัจจุบัน", dataIndex: "location", width: mobile ? 82 : 104 },
    {
      title: "สถานะ",
      key: "status",
      responsive: ["lg"],
      width: mobile ? 124 : 142,
      render: (_, row) => (
        <StatusTag row={row} pending={pendingByProduct.get(row.id)} />
      ),
    },
  ];
  return (
    <Table<AnalysisRow>
      rowKey="id"
      className="abc-table"
      columns={columns}
      dataSource={rows}
      pagination={false}

      rowSelection={
        mobile
          ? undefined
          : {
              type: "radio",
              selectedRowKeys: [selectedId],
              onChange: (_, selectedRows) => {
                if (selectedRows[0]) onSelect(selectedRows[0]);
              },
              getCheckboxProps: (row) => ({
                "aria-label": `เลือก ${row.id} ${row.name}`,
              }),
            }
      }
      rowClassName={(row) => (row.id === selectedId ? "selected-product" : "")}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filter === "pending"
                ? "ไม่มีรายการย้ายรอยืนยัน"
                : "ไม่มีสินค้าที่ควรย้ายในช่วงข้อมูลนี้"
            }
          >
            <Button onClick={onShowAll}>ดูสินค้าทั้งหมด</Button>
          </Empty>
        ),
      }}
    />
  );
}
