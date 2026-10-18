import { Alert, App, Button } from "antd";
import { useState } from "react";
import type { User } from "../../features/auth/api/client";
import { HistoryDrawer } from "../../features/master-data/components/HistoryDrawer";
import type { Lot, Product } from "../../features/master-data/types";

import { SearchToolbar } from "../../components/molecules/SearchToolbar";
import { LotEditor } from "../../features/master-data/components/LotEditor";
import { LotTable } from "../../features/master-data/components/LotTable";

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
      <SearchToolbar
        label="ค้นหาล็อต"
        placeholder="ค้นหารหัสล็อต เลขบนฉลาก หรือสินค้า"
        query={query}
        onQueryChange={setQuery}
      >
        <Button
          type="primary"
          disabled={loading || !products.some((product) => product.active)}
          onClick={() => setEditor({ lot: null })}
        >
          สร้างล็อต
        </Button>
      </SearchToolbar>
      <Alert
        className="master-data-feedback"
        type="info"
        showIcon
        title="เลขล็อตบนฉลากซ้ำกันได้ ให้เลือกรหัสล็อตภายในและวันที่ให้ตรงกับของจริง การสร้างล็อตยังไม่เพิ่มสต็อก"
      />
      <LotTable
        lots={visible}
        loading={loading}
        canManage={user.role === "admin"}
        onEdit={(item) => setEditor({ lot: item })}
        onHistory={setHistory}
        products={products}
      />
      {editor && (
        <LotEditor
          lot={lot}
          onCancel={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            void message.success("บันทึกล็อตแล้ว");
            void reload();
          }}
          products={products}
        />
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
