import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 }),
      ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("signs in, shows the role-protected users page, and signs out", async () => {
  const user = userEvent.setup();
  const account = { id: "admin-id", username: "admin", role: "admin" };
  render(<App />);
  await screen.findByRole("heading", { name: "เข้าสู่ระบบ" });
  vi.mocked(fetch).mockImplementation(async (path) => {
    if (path === "/api/auth/login")
      return Response.json({
        accessToken: "access",
        expiresIn: 900,
        user: account,
      });
    if (path === "/api/admin/users")
      return Response.json({
        users: [account, { id: "staff-id", username: "staff", role: "staff" }],
      });
    if (path === "/api/auth/logout") return new Response(null, { status: 204 });
    return Response.json({ user: account });
  });
  await user.type(screen.getByLabelText("ชื่อผู้ใช้"), "admin");
  await user.type(screen.getByLabelText("รหัสผ่าน"), "a-test-password");
  await user.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
  await screen.findByRole("heading", { name: "วิเคราะห์ ABC และจัดตำแหน่ง" });
  await user.click(screen.getByRole("menuitem", { name: /บัญชีของฉัน/ }));
  await screen.findByRole("heading", { name: "สวัสดี, admin" });
  await user.click(screen.getByRole("menuitem", { name: /ผู้ใช้งาน/ }));
  await screen.findByRole("cell", { name: "staff" });
  await user.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
  await screen.findByRole("heading", { name: "เข้าสู่ระบบ" });
}, 10_000); // The full Ant Design login/navigation/logout flow can exceed 5s in jsdom.

it("shows a generic login error without opening the workspace", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "เข้าสู่ระบบ" });
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 }),
  );
  await user.type(screen.getByLabelText("ชื่อผู้ใช้"), "admin");
  await user.type(screen.getByLabelText("รหัสผ่าน"), "incorrect");
  await user.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  );
  expect(screen.queryByRole("button", { name: "ออกจากระบบ" })).toBeNull();
});
