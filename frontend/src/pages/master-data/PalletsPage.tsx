import { Alert, Table, Tag } from "antd";
import { useState } from "react";
import { SearchToolbar } from "../../components/molecules/SearchToolbar";
import type { Catalog, Pallet } from "../../features/master-data/types";

const statusLabels: Record<Pallet["status"], string> = {
  stored: "จัดเก็บอยู่",
  awaiting_clearance: "รอเคลียร์พาเลต",
  cleared: "เคลียร์แล้ว",
};

export function PalletsPage({
  catalog,
  loading,
}: {
  catalog: Catalog;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const products = new Map(catalog.products.map((product) => [product.id, product]));
  const lots = new Map(catalog.lots.map((lot) => [lot.id, lot]));
  const locations = new Map(
    catalog.locations.map((location) => [location.id, location]),
  );
  const visible = catalog.pallets.filter((pallet) =>
    `${pallet.code} ${products.get(pallet.productId)?.sku ?? ""} ${products.get(pallet.productId)?.name ?? ""} ${lots.get(pallet.lotId)?.code ?? ""} ${locations.get(pallet.locationId ?? "")?.code ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <SearchToolbar
        label="ค้นหาพาเลต"
        placeholder="ค้นหาพาเลต สินค้า ล็อต หรือช่อง"
        query={query}
        onQueryChange={setQuery}
      />
      <Alert
        className="master-data-feedback"
        type="info"
        showIcon
        title="จำนวนพาเลตเปลี่ยนผ่านงานรับเข้า เบิก และตรวจนับ หน้านี้ใช้ดูข้อมูลเท่านั้น"
      />
      <Table<Pallet>
        rowKey="id"
        loading={loading}
        dataSource={visible}
        scroll={{ x: 850 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: "ยังไม่มีพาเลตในคลัง" }}
        columns={[
          { title: "พาเลต", dataIndex: "code" },
          {
            title: "สินค้า",
            render: (_, pallet) =>
              products.get(pallet.productId)?.sku ?? pallet.productId,
          },
          {
            title: "ล็อต",
            render: (_, pallet) => lots.get(pallet.lotId)?.code ?? pallet.lotId,
            width: 290,
          },
          { title: "จำนวน", dataIndex: "quantity", align: "right" },
          {
            title: "หน่วย",
            render: (_, pallet) => products.get(pallet.productId)?.unit ?? "—",
          },
          {
            title: "ช่อง",
            render: (_, pallet) =>
              locations.get(pallet.locationId ?? "")?.code ?? "—",
          },
          {
            title: "สถานะ",
            dataIndex: "status",
            render: (status: Pallet["status"]) => <Tag>{statusLabels[status]}</Tag>,
          },
        ]}
      />
    </>
  );
}
