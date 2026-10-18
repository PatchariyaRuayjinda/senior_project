import { Alert, App, Button, Select } from "antd";
import { useState } from "react";
import type { User } from "../../features/auth/api/client";
import { HistoryDrawer } from "../../features/master-data/components/HistoryDrawer";
import type { Product } from "../../features/master-data/types";

import { SearchToolbar } from "../../components/molecules/SearchToolbar";
import { ProductEditor } from "../../features/master-data/components/ProductEditor";
import { ProductTable } from "../../features/master-data/components/ProductTable";

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
  const [editor, setEditor] = useState<{ product: Product | null } | null>(null);
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
      <SearchToolbar
        label="ค้นหาสินค้า"
        placeholder="ค้นหารหัสหรือชื่อสินค้า"
        query={query}
        onQueryChange={setQuery}
      >
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
      </SearchToolbar>
      {!canManage && (
        <Alert
          className="master-data-feedback"
          type="info"
          title="คุณดูข้อมูลสินค้าและสร้างล็อตได้ ผู้ดูแลระบบเป็นผู้แก้ไขข้อมูลหลักสินค้า"
          showIcon
        />
      )}
      <ProductTable
        products={visible}
        loading={loading}
        canManage={canManage}
        onEdit={(item) => setEditor({ product: item })}
        onHistory={setHistory}
      />
      {editor && (
        <ProductEditor
          product={product}
          onCancel={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            void message.success("บันทึกสินค้าแล้ว");
            void reload();
          }}
        />
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
