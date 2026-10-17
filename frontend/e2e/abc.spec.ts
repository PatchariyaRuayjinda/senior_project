import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ชื่อผู้ใช้").fill("staff");
  await page.getByLabel("รหัสผ่าน").fill("browser-test-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" }),
  ).toBeVisible();
});

test("prepares, reserves and confirms a sample relocation without changing stock early", async ({
  page,
}) => {
  const panel = page.getByRole("complementary", {
    name: "จัดตำแหน่งสินค้าที่เลือก",
  });
  await expect(
    panel.getByRole("heading", { name: "C05", exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "เตรียมรายการย้าย" }),
  ).toBeDisabled();
  await panel
    .getByRole("combobox", { name: "ช่องปลายทาง", exact: true })
    .click();
  await page
    .getByRole("option", { name: "A01 · โซน A · ว่าง", exact: true })
    .click();
  await panel.getByRole("button", { name: "เตรียมรายการย้าย" }).click();
  await expect(
    panel.getByRole("heading", { name: "รอยืนยันการย้าย" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /P001/ })).toContainText("C05");
  await expect(
    panel.getByRole("button", { name: "ยืนยันการย้ายสินค้า" }),
  ).toBeDisabled();
  await panel
    .getByRole("checkbox", { name: "ย้ายสินค้าไป A01 ครบ 24 รีม แล้ว" })
    .check();
  await panel.getByRole("button", { name: "ยืนยันการย้ายสินค้า" }).click();
  await expect(
    panel.getByRole("heading", { name: "A01", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /P001/ })).toContainText(
    "ตรงโซนแล้ว",
  );
  await expect(panel.getByText("P001 · คงเหลือ 24 รีม")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("row", { name: /P001/ })).toContainText("C05");
});

test("supports date analysis, no-history products and empty filters", async ({
  page,
}) => {
  await page.locator("#analysis-range").fill("1 ม.ค. 2027");
  await page.locator("#analysis-range-end").fill("31 ม.ค. 2027");
  await page.locator("#analysis-range-end").press("Enter");
  await page.getByRole("button", { name: "วิเคราะห์ใหม่" }).click();
  await expect(
    page.getByText("ยังไม่มีประวัติเบิกในช่วงนี้", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /P001/ })).toContainText(
    "ไม่มีประวัติ",
  );
  await page
    .getByRole("radiogroup")
    .getByText("ควรย้าย 0", { exact: true })
    .click();
  await expect(
    page.getByText("ไม่มีสินค้าที่ควรย้ายในช่วงข้อมูลนี้", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ดูสินค้าทั้งหมด" }).click();
  await expect(page.getByRole("row", { name: /P008/ })).toBeVisible();
});

test("uses a white full-width mobile drawer, preserves pending work across navigation and cancels it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "กระดาษ A4 80 แกรม", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  expect(
    await drawer
      .locator(".ant-drawer-body")
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(255, 255, 255)");
  await drawer
    .getByRole("combobox", { name: "ช่องปลายทาง", exact: true })
    .click();
  await page
    .getByRole("option", { name: "A01 · โซน A · ว่าง", exact: true })
    .click();
  await drawer.getByRole("button", { name: "เตรียมรายการย้าย" }).click();
  await expect(
    drawer.getByRole("button", { name: "ยืนยันการย้ายสินค้า" }),
  ).toBeDisabled();
  await drawer.getByRole("button", { name: "ปิด", exact: true }).click();
  await page.getByRole("button", { name: "เปิดเมนู" }).click();
  await page.getByRole("menuitem", { name: /บัญชีของฉัน/ }).click();
  await expect(
    page.getByRole("heading", { name: "สวัสดี, staff" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "เปิดเมนู" }).click();
  await page.getByRole("menuitem", { name: /วิเคราะห์ ABC/ }).click();
  await page
    .getByRole("button", { name: "กระดาษ A4 80 แกรม", exact: true })
    .click();
  await expect(
    drawer.getByRole("heading", { name: "C05", exact: true }),
  ).toBeVisible();
  await drawer.getByRole("button", { name: "ยกเลิกรายการย้าย" }).click();
  await drawer
    .getByRole("combobox", { name: "ช่องปลายทาง", exact: true })
    .click();
  await expect(
    page.getByRole("option", { name: "A01 · โซน A · ว่าง", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
