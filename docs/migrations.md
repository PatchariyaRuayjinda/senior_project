# Database migrations

ใช้ `migrate-mongo` 14.0.7 ผ่าน Node และ Yarn ใน `backend/`
development ใช้ MongoDB Atlas ส่วน API ยังคงรันบน Bun
ขอบเขตมาจากการสัมภาษณ์ที่ผู้ใช้ยืนยัน: schema หลักก่อน เอกสาร workflow เพิ่มภายหลัง

## ตั้งค่า Atlas และใช้งาน

1. เตรียม database user ที่เข้าถึง application database ได้ รวมสิทธิ์สร้าง/ลบ collection,
   สร้าง indexes, อ่าน/เขียนข้อมูล และทำ transactions สำหรับ seed คลัง
   ตั้ง Atlas network access ให้เครื่องที่ใช้ CLI เชื่อมต่อได้
2. คัดลอก `backend/.env.example` เป็น `backend/.env` ถ้ายังไม่มีไฟล์
   กำหนด `MONGODB_URI` และ `MONGODB_DATABASE` ให้ชี้ database ใหม่ที่เลือกไว้
   URI ใช้ `mongodb+srv://...` ได้ ต้อง URL-encode อักขระพิเศษใน password
3. รันจาก `backend/`:

```sh
yarn migrate-status
yarn migrate-up
yarn migrate-status
yarn seed
yarn dev
```

CLI ต้องระบุทั้ง URI และชื่อ database อย่างชัดเจน ไม่ fallback ไป localhost หรือใช้ชื่อจาก URI
ตัวแปร environment ที่ export ไว้มีลำดับสูงกว่า `.env`
ใช้ Node 22.12+ ตามโปรเจกต์; CLI ไม่ต้องใช้ JWT secrets หรือรหัสบัญชี admin/staff
`yarn seed` และ API ยังคงต้องมี auth configuration ตาม README
อย่าใส่ connection string ลง migration หรือ commit `.env`

| คำสั่ง | พฤติกรรม |
| --- | --- |
| `yarn migrate-status` | อ่านรายการ applied/pending และสถานะ lock ไม่สร้าง collection/index/data |
| `yarn migrate-up` | ทำรายการ pending ตามชื่อไฟล์เรียงลำดับ หยุดเมื่อรายการใดผิดพลาด |
| `yarn migrate-down` | ย้อนรายการล่าสุดหนึ่งรายการเมื่อผ่านเงื่อนไขรักษาข้อมูล |

รัน migration ขณะ API หยุดอยู่ ก่อนเริ่ม API ใหม่ ไม่ใช่ระบบทำ online schema changes
API และ account seed ตรวจว่าประวัติ migration ตรงกับไฟล์ของแอปและไม่มี lock ค้าง
ไม่รัน migration หรือสร้าง indexes ให้เอง หากยังค้างจะบอกให้รัน status/up
หาก DB มีเวอร์ชันใหม่กว่าโค้ด ต้องใช้โค้ดที่ตรงกัน ไม่แก้ประวัติเพื่อข้ามการตรวจ

## Migration ชุดแรก

| ไฟล์ | Collections / การเปลี่ยนแปลง |
| --- | --- |
| `202610180001-auth-schema.js` | `users`, `sessions`, strict validators และ indexes ของ username, userId, session TTL |
| `202610180002-inventory-schema.js` | `warehouses`, `products`, `lots`, `locations`, `pallets` พร้อม strict validators และ indexes |
| `202610180003-base-warehouse.js` | คลัง `MAIN` และช่องว่าง A01–A05, B01–B05, C01–C05, R01–R20, TMP01 รวม 36 ช่อง |

โซนเป็น field ของช่อง: A/B/C สำหรับ picking, R สำหรับ reserve, TMP สำหรับ temporary
หนึ่งช่องรองรับหนึ่งพาเลต ไม่มีสินค้า ล็อต พาเลต หรือยอดตั้งต้นถูกสร้างโดย migration
บัญชีสร้างแยกด้วย `yarn seed` ซึ่งไม่แก้ password/role ของบัญชีที่มีอยู่

## Schema หลักที่ใช้

เอกสารใช้ string IDs ตามรูปแบบ auth เดิม
validators ปฏิเสธ field ที่ไม่ได้ประกาศ ต้องเพิ่ม migration เมื่อจะขยาย schema

| Collection | Fields สำคัญ |
| --- | --- |
| `warehouses` | `_id`, `code`, `name` |
| `products` | `_id`, `sku`, `name`, `unit`, `maxQuantityPerPallet`, `tracksExpiry`, `pickingMinimum`, `createdAt` |
| `lots` | `_id`, `productId`, `lotNumber`, `createdAt`; optional `manufacturedAt`, `expiresAt` |
| `locations` | `_id`, `warehouseId`, `code`, `kind`, `zone`, `capacity: 1` |
| `pallets` | `_id`, `code`, `productId`, `lotId`, `quantity`, `locationId`, `status`, `receivedAt` |

- วันที่เก็บเป็น BSON Date; ขอบเขตวันที่/เขตเวลาสำหรับ expiry และ ABC ต้องกำหนดตอนทำ workflow
- จำนวนเป็น integer ที่ไม่ติดลบและไม่เกิน JavaScript safe integer; ความจุต่อพาเลตต้องมากกว่าศูนย์
- SKU, รหัสคลัง, รหัสช่อง และรหัสพาเลตไม่ซ้ำ; เลขล็อต unique ตาม `productId + lotNumber`
- วันหมดอายุต้องไม่ก่อนวันผลิตเมื่อกรอกทั้งสองค่า
- พาเลต `stored` ต้องมียอดบวกและมีช่อง; `awaiting_clearance` มียอดศูนย์แต่ยังครองช่อง
  `cleared` มียอดศูนย์และ `locationId: null`
- partial unique index กันสองพาเลตครองช่องเดียว แม้พาเลตหนึ่งรอเคลียร์
  พาเลตที่เคลียร์แล้วหลายรายการมี `locationId: null` ได้

นี่เป็น structural validation ยังไม่บังคับ foreign keys หรือกฎข้าม collection
เช่น ล็อตต้องเป็นของ SKU นั้น, SKU ที่ tracksExpiry ต้องมี expiresAt ในล็อต,
จำนวนบนพาเลตไม่เกินความจุของ SKU และการรักษา provenance หลังรวมพาเลต
ต้องทำ validation/transaction ใน inventory workflows ต่อไป
ยังไม่มี API ให้แก้จำนวนพาเลตโดยตรง; schema ไม่ใช่สิ่งทดแทนประวัติรับเข้า/เบิก

## รันซ้ำ ความผิดพลาด และประวัติ

- ประวัติอยู่ใน `_migrations`; ไฟล์ที่ applied แล้วจะไม่รันซ้ำ
  ปิด `useFileHash` เพราะการแก้ไฟล์เก่าไม่ควรทำให้มันรันอีกรอบ
- ไฟล์และ helper `migration-support/v1.js` เป็น snapshot ที่ต้องรักษาไว้
  การเปลี่ยน schema ใช้ไฟล์ใหม่ ไม่ import โมเดลแอปที่เปลี่ยนตาม feature มาแก้ migration เก่า
- runner ปฏิเสธประวัติที่มี migration ไม่รู้จักหรือ applied ข้ามรายการ pending
- การสร้าง schema/indexes ไม่ได้ครอบทุกไฟล์ใน transaction เดียว
  หากค้างกลาง schema migration ให้ตรวจสาเหตุแล้ว `up` ใหม่
  helper ยอมรับ collection ที่ schema ตรงเดิมและสร้าง indexes ที่ขาด
  แต่ไม่เปลี่ยน schema ของ collection เดิมที่ไม่ตรงอย่างเงียบ ๆ
- seed คลังใช้ transaction และ `$setOnInsert` ไม่เขียนทับค่าเดิม
  จึง retry ได้ถ้าข้อมูล commit แล้วแต่ยังไม่บันทึก changelog
  ถ้า seed record ถูกแก้ก่อน retry จะหยุดให้ตรวจ ไม่เขียนทับ
- ไม่ auto-rollback migrations ก่อนหน้าที่สำเร็จเมื่อไฟล์ถัดไปล้มเหลว
  `status` ใช้ดูสิ่งที่สำเร็จแล้วได้

## กติกา down

- คำสั่งย้อนครั้งละหนึ่งไฟล์ ไม่ใช่ reset database และไม่ใช้ยกเลิกใบรับเข้า/ใบเบิก
- ย้อนข้อมูลคลังได้เฉพาะ seed records ที่ยังไม่เปลี่ยน ไม่มีช่อง/คลังเพิ่มเติม
  และไม่มีข้อมูล inventory หรือ collection ปฏิบัติการอื่นที่อาจอ้างถึงคลัง
  ไม่ลบบัญชีหรือ session ในขั้นนี้
- ย้อน schema inventory/auth ได้เมื่อทุก collection ในไฟล์นั้นว่างเท่านั้น
  ตรวจครบทุก collection ก่อนเริ่ม drop ไม่ลบทีละตัวแล้วค่อยพบข้อมูล
- ถ้าปฏิเสธการย้อน จะเก็บ changelog ไว้และคืน exit code 1
  ตรวจสาเหตุหรือสร้าง migration ใหม่แก้ไปข้างหน้า ไม่แก้ changelog ให้ดูเหมือนย้อนแล้ว
- DDL มีโอกาสล้มเหลวกลางทาง แม้ preflight ผ่าน ต้องหยุด API ขณะทำเสมอ
  ถ้า drop ไปบาง collection แล้ว `down` ล้มเหลว สามารถ retry หลังตรวจสาเหตุได้

## เพิ่ม migration ถัดไป

สร้างไฟล์ใน `backend/migrations/` โดยใช้ timestamp ที่เรียงหลังไฟล์ที่มีอยู่
เช่น `202610190001-add-receipts.js` และ export สองฟังก์ชัน:

```js
export async function up(db, client) {
    // Apply this version's changes, including retry preconditions.
}

export async function down(db, client) {
    // Check all rollback preconditions before changing anything.
}
```

`migrate-status` จะเห็นไฟล์ใหม่เป็น pending และ API จะรอให้ `migrate-up` สำเร็จก่อนเริ่ม
อย่าเปลี่ยนชื่อหรือเนื้อหาไฟล์ applied แล้ว เพิ่ม migration ใหม่เมื่อต้องเปลี่ยน schema
และเพิ่ม integration test ของพฤติกรรมจริงที่เปลี่ยน

## กันรันซ้อนและกู้ lock

runner ครอบ `migrate-mongo` ด้วย atomic insert `_id: runner` ใน `_migration_lock`
ก่อนอ่านรายการ pending เพื่อไม่ให้สอง process เริ่มเปลี่ยน schema พร้อมกัน
ปิด TTL lock ของไลบรารี ใช้ owner token ลบเฉพาะ lock ที่ process นั้นเป็นเจ้าของใน `finally`
ไม่มีการหมดอายุอัตโนมัติที่อาจเปิดทางให้ migration ยาวถูกรันแทรก

ถ้า process ถูก kill/crash จนค้าง lock:

1. หยุด API และตรวจว่าไม่มี migration runner ยังทำงานอยู่
2. ตรวจรายการ `status` และข้อมูล/schema ที่อาจ commit แล้ว
3. ใน Atlas Data Explorer ลบเฉพาะ document `_id: runner` จาก `_migration_lock`
   ห้ามลบ `_migrations` หรือ clear collection อื่น
4. รัน `status` แล้ว retry คำสั่งที่ค้างหลังแก้สาเหตุ

CLI แสดง precondition ที่ตรวจเอง และซ่อนรายละเอียด driver error ที่อาจมีข้อมูลเชื่อมต่อ
กรณี connection/permission ล้มเหลวให้ตรวจ URI, Atlas network access, DB privileges
และการรองรับ transactions จาก Atlas โดยไม่พิมพ์ credentials ลง log

## การตรวจสอบ

รัน `yarn typecheck` และ `yarn test` ใน `backend/`
tests เปิด MongoDB 7.0.24 replica set ชั่วคราวและเรียก Node CLI จริง
ไม่โหลด `.env` และ override URI/database ของทุก child process
ครอบคลุม up ซ้ำ, status แบบ read only, down/up, validation/indexes,
การห้ามลบข้อมูล, การกัน runner ซ้อน และ startup ที่ไม่สร้าง schema เอง
browser tests ใช้ migration ชุดเดียวกันก่อนทดสอบ auth และหน้า ABC ตัวอย่าง
