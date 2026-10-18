import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const user = { id: "user-id", username: "admin", role: "admin" };
const session = (accessToken: string) =>
  Response.json({ accessToken, expiresIn: 900, user });
const unauthorized = () =>
  Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
let client: typeof import("./client");
let fetchMock = vi.fn<typeof fetch>();

beforeEach(async () => {
  vi.resetModules();
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  client = await import("./client");
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser session lifecycle", () => {
  it("preserves a mutation body and idempotency key when renewing an expired token", async () => {
    fetchMock
      .mockResolvedValueOnce(session("old"))
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(session("new"))
      .mockResolvedValueOnce(Response.json({ product: { id: "p1" } }));
    await client.login("admin", "test-password");
    const body = JSON.stringify({ sku: "PEN-001" });
    await client.apiRequest("/api/inventory/products", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "same-change",
      },
    });
    const attempts = fetchMock.mock.calls.filter(
      ([path]) => path === "/api/inventory/products",
    );
    expect(attempts).toHaveLength(2);
    for (const [, options] of attempts) {
      expect(options).toMatchObject({ method: "POST", body });
      expect(new Headers(options?.headers).get("idempotency-key")).toBe(
        "same-change",
      );
    }
    expect(new Headers(attempts[1]?.[1]?.headers).get("authorization")).toBe(
      "Bearer new",
    );
  });
  it("keeps access tokens out of local/session storage and shares a single refresh across concurrent requests", async () => {
    let refreshes = 0;
    fetchMock.mockImplementation(async (path, options) => {
      if (path === "/api/auth/login") return session("old-access");
      if (path === "/api/auth/refresh") {
        refreshes++;
        return session("new-access");
      }
      if (
        options?.headers &&
        (options.headers as Record<string, string>).Authorization ===
          "Bearer old-access"
      )
        return unauthorized();
      return Response.json({ ok: true });
    });
    await client.login("admin", "test-password");
    const results = await Promise.all([
      client.apiRequest("/api/one"),
      client.apiRequest("/api/two"),
    ]);
    expect(results).toEqual([{ ok: true }, { ok: true }]);
    expect(refreshes).toBe(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("restores a session through the cookie without a persisted access token", async () => {
    fetchMock
      .mockResolvedValueOnce(session("restored-access"))
      .mockResolvedValueOnce(Response.json({ user }));
    expect(await client.apiRequest("/api/auth/me")).toEqual({ user });
    expect(fetchMock.mock.calls[0]).toEqual([
      "/api/auth/refresh",
      { method: "POST", credentials: "same-origin" },
    ]);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual({
      Authorization: "Bearer restored-access",
    });
  });

  it("does not try refreshing on a forbidden response", async () => {
    fetchMock
      .mockResolvedValueOnce(session("access"))
      .mockResolvedValueOnce(
        Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
      );
    await client.login("admin", "test-password");
    await expect(client.apiRequest("/api/admin/users")).rejects.toMatchObject({
      status: 403,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops after one retry and notifies the UI when the session is invalid", async () => {
    const changes = vi.fn();
    const unsubscribe = client.subscribeSession(changes);
    fetchMock
      .mockResolvedValueOnce(session("old"))
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(session("new"))
      .mockResolvedValueOnce(unauthorized());
    await client.login("admin", "test-password");
    await expect(client.apiRequest("/api/auth/me")).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(changes).toHaveBeenLastCalledWith(null);
    unsubscribe();
  });

  it("clears the UI after server logout succeeds and does not claim success on network failure", async () => {
    const changes = vi.fn();
    const unsubscribe = client.subscribeSession(changes);
    fetchMock
      .mockResolvedValueOnce(session("access"))
      .mockRejectedValueOnce(new TypeError("offline"));
    await client.login("admin", "test-password");
    await expect(client.logout()).rejects.toThrow("offline");
    expect(changes).toHaveBeenLastCalledWith(user);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await client.logout();
    expect(changes).toHaveBeenLastCalledWith(null);
    unsubscribe();
  });
});
