import { Space, Table, Tag } from "antd";
import type { Location, LocationKind } from "../types";

import { RecordActions } from "../../../components/molecules/RecordActions";
import { kindLabels } from "../locationLabels";

export function LocationTable({
  locations,
  loading,
  canManage,
  onEdit,
  onHistory,
}: {
  locations: Location[];
  loading: boolean;
  canManage: boolean;
  onEdit: (record: Location) => void;
  onHistory: (record: Location) => void;
}) {
  return (
    <Table<Location>
      rowKey="id"
      loading={loading}
      dataSource={locations}
      scroll={{ x: 950 }}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      locale={{ emptyText: "ไม่พบช่องเก็บที่ตรงกับการค้นหา" }}
      columns={[
        { title: "รหัสช่อง", dataIndex: "code", width: 130 },
        {
          title: "ประเภท",
          dataIndex: "kind",
          render: (kind: LocationKind) => kindLabels[kind],
          width: 145,
        },
        { title: "โซน", dataIndex: "zone", width: 80 },
        {
          title: "พาเลต / งานจอง",
          render: (_, item) =>
            item.palletCode ||
            (item.reservedBy ? `จองโดย ${item.reservedBy}` : "ว่าง"),
          width: 190,
        },
        {
          title: "สถานะ",
          render: (_, item) => (
            <Space wrap>
              {!item.active && <Tag>ปิดใช้งาน</Tag>}
              {item.inboundBlocked && <Tag color="orange">ระงับรับเข้า</Tag>}
              {item.outboundBlocked && <Tag color="orange">ระงับนำออก</Tag>}
              {item.active && !item.inboundBlocked && !item.outboundBlocked && (
                <Tag>เปิดใช้งาน</Tag>
              )}
            </Space>
          ),
        },
        {
          title: "จัดการ",
          width: 155,
          render: (_, item) => (
            <RecordActions
              label={item.code}
              onEdit={canManage ? () => onEdit(item) : undefined}
              onHistory={() => onHistory(item)}
            />
          ),
        },
      ]}
    />
  );
}
