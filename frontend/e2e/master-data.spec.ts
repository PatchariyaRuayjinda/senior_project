import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, username: string) {
  await page.goto("/");
  await page.getByLabel("ชื่อผู้ใช้").fill(username);
  await page.getByLabel("รหัสผ่าน").fill("browser-test-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" }),
  ).toBeVisible();
}

test("admin maintains persistent products, lots and locations; staff reads master data and creates lots", async ({
  page,
}) => {
  test.setTimeout(60000);
  const sku = `E2E-${Date.now()}`;
  await signIn(page, "admin");
  await page
    .getByRole("menuitem", { name: "ข้อมูลสินค้า", exact: true })
    .click();
  await page.getByRole("button", { name: "เพิ่มสินค้า", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("รหัสสินค้า", { exact: true })
    .fill(` ${sku.toLowerCase()} `);
  await dialog.getByLabel("ชื่อสินค้า", { exact: true }).fill("กล่องทดสอบ");
  await dialog.getByLabel("หน่วยนับหลัก").fill("กล่อง");
  await dialog.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("cell", { name: sku, exact: true }),
  ).toBeVisible();

  await page.reload();
  await page
    .getByRole("menuitem", { name: "ข้อมูลสินค้า", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: sku, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: `แก้ไข ${sku}`, exact: true }).click();
  await dialog
    .getByLabel("ชื่อสินค้า", { exact: true })
    .fill("กล่องทดสอบแก้ชื่อ");
  await dialog.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: `ประวัติ ${sku}`, exact: true })
    .click();
  await expect(
    page.getByText("กล่องทดสอบ → กล่องทดสอบแก้ชื่อ", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByText("กล่องทดสอบ → กล่องทดสอบแก้ชื่อ", { exact: true }),
  ).not.toBeVisible();
  await page.screenshot({
    path: "test-results/master-data-desktop.png",
    fullPage: true,
  });

  await page.getByRole("menuitem", { name: "ช่องเก็บ", exact: true }).click();
  await page
    .getByRole("button", { name: "เพิ่มช่องเก็บ", exact: true })
    .click();
  const slotCode = `A-${Date.now()}`;
  await dialog.getByLabel("รหัสช่องเก็บ", { exact: true }).fill(slotCode);
  await dialog.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByLabel("ค้นหาช่องเก็บ", { exact: true }).fill(slotCode);
  await expect(
    page.getByRole("cell", { name: slotCode, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `แก้ไข ${slotCode}`, exact: true })
    .click();
  await dialog.getByLabel("ระงับรับเข้า", { exact: true }).click();
  await dialog
    .getByLabel("เหตุผลการเปลี่ยนแปลง", { exact: true })
    .fill("ตรวจพื้นที่ก่อนใช้งาน");
  await dialog.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("ระงับรับเข้า", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("menuitem", { name: "ช่องเก็บ", exact: true }).click();
  await page.getByLabel("ค้นหาช่องเก็บ", { exact: true }).fill(slotCode);
  await expect(page.getByText("ระงับรับเข้า", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "เข้าสู่ระบบ", exact: true }),
  ).toBeVisible();
  await signIn(page, "staff");
  await page
    .getByRole("menuitem", { name: "ข้อมูลสินค้า", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: sku, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "เพิ่มสินค้า", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `แก้ไข ${sku}`, exact: true }),
  ).toHaveCount(0);
  await page.getByRole("menuitem", { name: "ล็อตสินค้า", exact: true }).click();
  for (let index = 0; index < 2; index++) {
    await page.getByRole("button", { name: "สร้างล็อต", exact: true }).click();
    await dialog
      .getByRole("combobox", { name: "สินค้า", exact: true })
      .fill(sku);
    await page.getByText(`${sku} · กล่องทดสอบแก้ชื่อ`, { exact: true }).click();
    await dialog
      .getByLabel("เลขล็อตบนฉลากผู้ผลิต", { exact: true })
      .fill(`LABEL-${sku}`);
    await dialog.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  await page.getByLabel("ค้นหาล็อต", { exact: true }).fill(sku);
  await expect(
    page.getByRole("cell", { name: `LABEL-${sku}`, exact: true }),
  ).toHaveCount(2);
  await page.reload();
  await page.getByRole("menuitem", { name: "ล็อตสินค้า", exact: true }).click();
  await page.getByLabel("ค้นหาล็อต", { exact: true }).fill(sku);
  await expect(
    page.getByRole("cell", { name: `LABEL-${sku}`, exact: true }),
  ).toHaveCount(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
  await page.getByRole("menuitem", { name: "ช่องเก็บ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "ช่องเก็บ", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "เมนูหลัก", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "เพิ่มช่องเก็บ", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/master-data-mobile.png",
    fullPage: true,
  });
});
