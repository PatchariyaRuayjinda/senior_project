import { ApiError, apiRequest, errorMessage } from "../auth/client";
import type {
  Catalog,
  EntityType,
  InventoryEvent,
  Location,
  LocationInput,
  Lot,
  LotInput,
  Product,
  ProductInput,
} from "./types";

export async function loadCatalog(): Promise<Catalog> {
  const [products, lots, locations, pallets] = await Promise.all([
    apiRequest<Pick<Catalog, "products">>("/api/inventory/products"),
    apiRequest<Pick<Catalog, "lots">>("/api/inventory/lots"),
    apiRequest<Pick<Catalog, "locations">>("/api/inventory/locations"),
    apiRequest<Pick<Catalog, "pallets">>("/api/inventory/pallets"),
  ]);
  return { ...products, ...lots, ...locations, ...pallets };
}

function save<T>(
  path: string,
  method: "POST" | "PUT",
  body: unknown,
  key: string,
) {
  return apiRequest<T>(`/api/inventory/${path}`, {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
  });
}

export function saveProduct(
  input: ProductInput & { active?: boolean },
  product: Product | null,
  key: string,
) {
  return product
    ? save<{ product: Product }>(
        `products/${product.id}`,
        "PUT",
        { ...input, revision: product.revision },
        key,
      )
    : save<{ product: Product }>(
        "products",
        "POST",
        {
          sku: input.sku,
          name: input.name,
          unit: input.unit,
          maxQuantityPerPallet: input.maxQuantityPerPallet,
          tracksExpiry: input.tracksExpiry,
          pickingMinimum: input.pickingMinimum,
          pickingTarget: input.pickingTarget,
        },
        key,
      );
}

export function saveLot(input: LotInput, lot: Lot | null, key: string) {
  return lot
    ? save<{ lot: Lot }>(
        `lots/${lot.id}`,
        "PUT",
        { ...input, revision: lot.revision },
        key,
      )
    : save<{ lot: Lot }>("lots", "POST", input, key);
}

export interface LocationChanges extends LocationInput {
  active: boolean;
  inboundBlocked: boolean;
  outboundBlocked: boolean;
  reason?: string;
  labelConfirmed?: boolean;
}

export function saveLocation(
  input: LocationChanges,
  location: Location | null,
  key: string,
) {
  if (location)
    return save<{ location: Location }>(
      `locations/${location.id}`,
      "PUT",
      { ...input, revision: location.revision },
      key,
    );
  const { code, kind, zone } = input;
  return save<{ location: Location }>(
    "locations",
    "POST",
    { code, kind, zone },
    key,
  );
}

export function loadHistory(entityType: EntityType, id: string) {
  return apiRequest<{ events: InventoryEvent[] }>(
    `/api/inventory/history/${entityType}/${encodeURIComponent(id)}`,
  );
}

const messages: Record<string, string> = {
  DUPLICATE_CODE:
    "รหัสนี้ถูกใช้แล้ว รวมถึงข้อมูลที่ปิดใช้งาน กรุณาเลือกรหัสอื่น",
  STALE_RECORD:
    "ข้อมูลเปลี่ยนไปแล้ว กรุณาปิดหน้าต่างและโหลดข้อมูลล่าสุดก่อนแก้ไขอีกครั้ง",
  IDEMPOTENCY_CONFLICT:
    "คำขอนี้เคยบันทึกด้วยข้อมูลอื่นแล้ว กรุณาโหลดข้อมูลล่าสุด",
  PRODUCT_FIELDS_LOCKED:
    "สินค้านี้เคยรับเข้าแล้ว จึงแก้รหัส หน่วยนับ และการติดตามหมดอายุไม่ได้",
  CAPACITY_IN_USE: "ลดความจุไม่ได้ เพราะมีพาเลตที่มีจำนวนเกินค่าที่กำหนด",
  INVALID_PICKING_TARGET: "ยอดเป้าหมายต้องไม่น้อยกว่ายอดขั้นต่ำ",
  LOT_EXPIRY_REQUIRED: "สินค้าที่ติดตามหมดอายุต้องระบุวันหมดอายุให้ครบทุกล็อต",
  PRODUCT_INACTIVE:
    "สินค้านี้ปิดใช้งานอยู่ กรุณาให้ผู้ดูแลเปิดใช้งานก่อนสร้างล็อต",
  LOT_FIELDS_LOCKED:
    "ล็อตนี้เคยรับเข้าแล้ว จึงแก้ข้อมูลโดยตรงไม่ได้ ต้องใช้คำขอแก้วันที่ล็อต",
  LOT_PRODUCT_LOCKED: "เปลี่ยนสินค้าของล็อตเดิมไม่ได้",
  INVALID_DATE: "กรุณาระบุวันที่ปฏิทินที่ถูกต้อง",
  INVALID_DATE_ORDER: "วันหมดอายุต้องไม่ก่อนวันผลิต",
  LOCATION_IN_USE:
    "ช่องนี้มีพาเลตหรือมีงานจองอยู่ ต้องเคลียร์พาเลตและจัดการงานก่อนแก้ข้อมูลหรือปิดใช้งาน",
  TEMPORARY_LOCATION_FIXED:
    "TMP01 เป็นช่องพักเฉพาะ ต้องคงรหัส ประเภท และเปิดใช้งานไว้",
  LABEL_CONFIRMATION_REQUIRED:
    "กรุณายืนยันว่าปรับป้ายช่องจริงตรงกับรหัสใหม่แล้ว",
  BLOCK_REASON_REQUIRED: "กรุณาระบุเหตุผลเมื่อระงับหรือปลดระงับช่อง",
  INVALID_LOCATION_ZONE: "โซนไม่ตรงกับประเภทพื้นที่",
  INVALID_REQUEST:
    "กรุณาตรวจสอบข้อมูลที่กรอก จำนวนต้องเป็นจำนวนเต็มและข้อความต้องไม่ว่าง",
};

export function masterDataError(error: unknown) {
  return error instanceof ApiError && messages[error.code]
    ? messages[error.code]!
    : errorMessage(error);
}
