import { MasterDataTemplate } from "../../components/templates/MasterDataTemplate";
import type { User } from "../../features/auth/api/client";
import { useCatalog } from "../../features/master-data/hooks/useCatalog";
import { LocationsPage } from "./LocationsPage";
import { LotsPage } from "./LotsPage";
import { PalletsPage } from "./PalletsPage";
import { ProductsPage } from "./ProductsPage";

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
    <MasterDataTemplate
      title={masterDataTitles[view]}
      description={descriptions[view]}
      error={error}
      loading={loading}
      reload={reload}
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
      {view === "pallets" && <PalletsPage catalog={catalog} loading={loading} />}
    </MasterDataTemplate>
  );
}
