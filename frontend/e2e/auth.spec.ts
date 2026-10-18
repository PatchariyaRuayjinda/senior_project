import { expect, test } from "@playwright/test";

test("login, cross-tab restoration, reload, server-side logout and role enforcement", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "เข้าสู่ระบบ" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("ชื่อผู้ใช้").fill("admin");
  await page.getByLabel("รหัสผ่าน").fill("browser-test-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(
    page.getByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" }),
  ).toBeVisible();

  // Cookie is shared, while each tab must recover its own in-memory access token.
  const secondTab = await context.newPage();
  await Promise.all([page.reload(), secondTab.goto("/")]);
  await expect(
    page.getByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" }),
  ).toBeVisible();
  await expect(
    secondTab.getByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);

  await page.getByRole("menuitem", { name: /ผู้ใช้งาน/ }).click();
  await expect(
    page.getByRole("cell", { name: "staff", exact: true }),
  ).toBeVisible();
  const refresh = await page.request.post("/api/auth/refresh", {
    headers: { Origin: "http://localhost:4173" },
  });
  expect(refresh.status()).toBe(200);
  const { accessToken } = await refresh.json();
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(
    page.getByRole("heading", { name: "เข้าสู่ระบบ" }),
  ).toBeVisible();
  await expect(
    secondTab.getByRole("heading", { name: "เข้าสู่ระบบ" }),
  ).toBeVisible();
  expect(
    (
      await page.request.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).status(),
  ).toBe(401);

  await page.getByLabel("ชื่อผู้ใช้").fill("staff");
  await page.getByLabel("รหัสผ่าน").fill("browser-test-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(
    page.getByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /ผู้ใช้งาน/ })).toHaveCount(
    0,
  );
  await expect(
    secondTab.getByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" }),
  ).toBeVisible();
  const staffRefresh = await page.request.post("/api/auth/refresh", {
    headers: { Origin: "http://localhost:4173" },
  });
  const staffSession = await staffRefresh.json();
  expect(
    (
      await page.request.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${staffSession.accessToken}` },
      })
    ).status(),
  ).toBe(403);
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "เข้าสู่ระบบ" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/login-mobile.png",
    fullPage: true,
  });
});
