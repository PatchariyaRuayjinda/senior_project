# Inventory playground

โปรเจกต์นี้เป็นการปรับปรุงแอปจัดการคลังสินค้าจากโปรเจกต์ระดับปริญญาตรี เพื่อใช้ฝึกพัฒนาฟีเจอร์และทำงานร่วมกับ AI โดยส่วนแรกที่ใช้งานได้คือระบบยืนยันตัวตน

- `backend/`: Elysia + Bun + TypeScript, MongoDB native driver, JOSE และ Argon2id
- `frontend/`: React 18 + Vite + TypeScript + Ant Design (Clear Blue)
- `legacy/`: แอปต้นฉบับที่เก็บไว้ใช้อ้างอิง
- [การออกแบบระบบยืนยันตัวตน](docs/auth.md): วงจรชีวิต token, การกำหนดสิทธิ์ และการทดสอบ
- [Workflow ของ ABC](docs/ux/abc-stock/README.md): พฤติกรรมที่ตกลงและเลย์เอาต์ Clear Blue
- [การทำงานของหน้า ABC](docs/ux/abc-stock/implementation.md): ตัวอย่าง workflow ข้อจำกัดของข้อมูล และการตรวจสอบ

## เริ่มใช้งานในเครื่อง

ต้องใช้ Node **22.12 ขึ้นไป** และ Yarn **4.10.3** ติดตั้ง dependency แยกกันในแต่ละแพ็กเกจ:

```sh
cd backend
yarn install
cd ../frontend
yarn install
```

Bun 1.4.3 เป็น dependency สำหรับพัฒนา backend โดย Yarn จะใช้ Bun เวอร์ชันภายในโปรเจกต์ อนุญาตให้รัน installation script เฉพาะของ Bun ส่วน dependency อื่นจะไม่รัน installation script

เปิด MongoDB จากโฟลเดอร์หลักของโปรเจกต์ หรือกำหนด URI ของ MongoDB ในเครื่องที่ต้องการใช้:

```sh
docker compose up -d mongodb
cp backend/.env.example backend/.env
```

แก้ไข `backend/.env` โดยสร้าง signing secret ที่แตกต่างกัน **2 ค่า** ด้วยคำสั่ง `openssl rand -hex 32` และกำหนดรหัสผ่านของ admin/staff เอง (ความยาว 12–128 ตัวอักษร) เก็บไฟล์นี้ไว้เป็นความลับและอย่า commit ขึ้น Git ให้ใช้ฐานข้อมูลใหม่ เนื่องจากข้อมูลบัญชีแบบเก่ายังไม่มีการ migrate

เปิด terminal หนึ่งหน้าต่างแล้วรัน:

```sh
cd backend
yarn seed
yarn dev
```

เปิดอีก terminal แล้วรัน:

```sh
cd frontend
yarn start
```

เข้า **http://localhost:5173** โดยค่า `APP_ORIGIN` ต้องตรงกันทุกตัวอักษร Vite จะส่งคำขอ `/api` ไปที่ `http://127.0.0.1:3001` เข้าสู่ระบบด้วยบัญชีที่กำหนดไว้ใน `.env` โดย admin เปิดหน้ารายชื่อผู้ใช้ได้ ส่วน staff ไม่มีสิทธิ์เรียก API ส่วนนั้น การ seed จะสร้างเฉพาะบัญชีที่ยังไม่มี และไม่เปลี่ยนรหัสผ่านหรือ role ของบัญชีเดิม ระบบยังไม่มี endpoint สำหรับสมัครสมาชิกสาธารณะ

## ตรวจสอบโปรเจกต์

```sh
cd backend
yarn typecheck
yarn test
```

การทดสอบ backend จะเปิด MongoDB 7.0.24 แยกต่างหากและทดสอบ HTTP handler จริง ในการรันครั้งแรก ระบบจะดาวน์โหลด MongoDB binary ไปไว้ที่ `.cache/mongodb` โดยจะไม่ใช้หรือลบข้อมูลจากฐานข้อมูลเดิม

```sh
cd frontend
yarn test
yarn build
yarn playwright install chromium
yarn test:e2e
```

การทดสอบผ่านเบราว์เซอร์จะเปิด API/ฐานข้อมูลและ Vite server ของตัวเองที่พอร์ต 3101/4173 ครอบคลุมการเข้าสู่ระบบ การกู้คืนสถานะในหลายแท็บ การ reload การ logout ข้ามแท็บ การเพิกถอน session จาก server สิทธิ์ของ staff และเลย์เอาต์หน้า login บนมือถือ ภาพหน้าจอจะถูกบันทึกไว้ใน `frontend/test-results/` ซึ่งถูกตั้งค่าให้ Git มองข้าม

## ขอบเขตการทำงานปัจจุบัน

แอปส่วนที่กำลังพัฒนามีหน้า login, การต่ออายุ session อัตโนมัติ, logout, รายละเอียดบัญชี, รายชื่อผู้ใช้สำหรับ admin เท่านั้น และหน้าตัวอย่าง ABC/ตำแหน่งจัดเก็บสินค้าที่โต้ตอบได้ด้วย Ant Design ข้อมูล ABC เป็นข้อมูลตัวอย่างในหน่วยความจำและมีป้ายกำกับชัดเจน เมื่อ reload หรือ logout ข้อมูลสินค้าและการย้ายตำแหน่งจะถูกรีเซ็ต ขณะนี้ยังไม่มี Inventory API หรือการบันทึกข้อมูลคลังสินค้าลง MongoDB โดยเก็บระบบเดิมไว้ใน `legacy/` เพื่อใช้อ้างอิง

การตั้งค่านี้ใช้สำหรับพัฒนาในเครื่อง โดย Docker จะผูกพอร์ตฐานข้อมูลไว้กับ loopback หากนำระบบขึ้นโฮสต์ ให้เสิร์ฟ frontend และ `/api` ภายใต้ HTTPS origin เดียวกัน และตั้งค่า cookie สำหรับ production ตามที่อธิบายไว้ใน [เอกสารออกแบบระบบยืนยันตัวตน](docs/auth.md)
