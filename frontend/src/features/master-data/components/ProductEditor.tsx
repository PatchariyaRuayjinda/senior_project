import { saveProduct } from "../api/client";
import type { Product, ProductInput } from "../types";
import { MasterDataEditor } from "./MasterDataEditor";

import { ProductFields } from "./ProductFields";

type ProductValues = ProductInput & { active: boolean };
const defaults: ProductValues = {
  sku: "",
  name: "",
  unit: "",
  maxQuantityPerPallet: 100,
  tracksExpiry: false,
  pickingMinimum: 0,
  pickingTarget: 100,
  active: true,
};

export function ProductEditor({
  product,
  onCancel,
  onSaved,
}: {
  product: Product | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  return (
    <MasterDataEditor<ProductValues>
      key={product?.id ?? "new"}
      title={product ? `แก้ไขสินค้า · ${product.sku}` : "เพิ่มสินค้า"}
      initialValues={
        product
          ? {
              sku: product.sku,
              name: product.name,
              unit: product.unit,
              maxQuantityPerPallet: product.maxQuantityPerPallet,
              tracksExpiry: product.tracksExpiry,
              pickingMinimum: product.pickingMinimum,
              pickingTarget: product.pickingTarget,
              active: product.active,
            }
          : defaults
      }
      onSave={(values, key) => saveProduct(values, product, key)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <ProductFields product={product} />
    </MasterDataEditor>
  );
}
