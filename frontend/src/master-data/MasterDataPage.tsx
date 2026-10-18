import { Alert, Button, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { User } from "../auth/client";
import { useCatalog } from "./useCatalog";
import { ProductsPage } from "./ProductsPage";
import { LotsPage } from "./LotsPage";
import { LocationsPage } from "./LocationsPage";
import { PalletsPage } from "./PalletsPage";

export const masterDataTitles = {
  products: "ข้อมูลสินค้า",
  lots: "ล็อตสินค้า",
  locations: "ช่องเก็บ",
  pallets: "พาเลต",
};
export type MasterDataView = keyof typeof masterDataTitles;
const descriptions: Record<MasterDataView, string> = {
  products: "สินค้า หน่วยนับ ความจุ และเกณฑ์เติมจุดหยิบ",
  lots: "แยกล็อตภายในจากเลขบนฉลาก พร้อมวันผลิตและวันหมดอายุ",
  locations: "ประเภทพื้นที่ โซน และสถานะรับเข้า/นำออกของแต่ละช่อง",
  pallets: "สินค้า ล็อต จำนวน และตำแหน่งปัจจุบันของแต่ละพาเลต",
};

export function MasterDataPage({
  view,
  user,
}: {
  view: MasterDataView;
  user: User;
}) {
  const { catalog, error, loading, reload } = useCatalog();
  return (
    <>
      <div className="page-heading master-data-heading">
        <div>
          <Typography.Title level={1}>
            {masterDataTitles[view]}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            {descriptions[view]}
          </Typography.Paragraph>
        </div>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => void reload()}
        >
          โหลดข้อมูลใหม่
        </Button>
      </div>
      {error && (
        <Alert
          className="master-data-feedback"
          type="error"
          showIcon
          title={error}
          action={<Button onClick={() => void reload()}>ลองใหม่</Button>}
        />
      )}
      <section
        className="master-data-section"
        aria-label={masterDataTitles[view]}
      >
        {view === "products" && (
          <ProductsPage
            products={catalog.products}
            user={user}
            loading={loading}
            reload={reload}
          />
        )}
        {view === "lots" && (
          <LotsPage
            lots={catalog.lots}
            products={catalog.products}
            user={user}
            loading={loading}
            reload={reload}
          />
        )}
        {view === "locations" && (
          <LocationsPage
            locations={catalog.locations}
            user={user}
            loading={loading}
            reload={reload}
          />
        )}
        {view === "pallets" && (
          <PalletsPage catalog={catalog} loading={loading} />
        )}
      </section>
    </>
  );
}
