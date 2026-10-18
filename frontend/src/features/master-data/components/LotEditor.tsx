import { saveLot } from "../api/client";
import type { Lot, LotInput, Product } from "../types";
import { MasterDataEditor } from "./MasterDataEditor";

import { LotFields } from "./LotFields";

export function LotEditor({
  lot,
  onCancel,
  onSaved,
  products,
}: {
  lot: Lot | null;
  products: Product[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  return (
    <MasterDataEditor<LotInput>
      key={lot?.id ?? "new"}
      title={lot ? "แก้ไขล็อตที่ยังไม่รับเข้า" : "สร้างล็อต"}
      initialValues={
        lot
          ? {
              productId: lot.productId,
              lotNumber: lot.lotNumber ?? "",
              manufacturedAt: lot.manufacturedAt ?? "",
              expiresAt: lot.expiresAt ?? "",
            }
          : {
              productId: "",
              lotNumber: "",
              manufacturedAt: "",
              expiresAt: "",
            }
      }
      onSave={(values, key) => saveLot(values, lot, key)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <LotFields products={products} editing={!!lot} />
    </MasterDataEditor>
  );
}
