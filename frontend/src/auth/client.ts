export interface User {
  id: string;
  username: string;
  role: "admin" | "staff";
}
interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<User> | null = null;
let mutationQueue: Promise<unknown> = Promise.resolve();
let channel: BroadcastChannel | null = null;
const listeners = new Set<(user: User | null) => void>();

function setSession(session: SessionResponse | null) {
  accessToken = session?.accessToken ?? null;
  for (const listener of listeners) listener(session?.user ?? null);
}

// Refresh, login and logout share a queue. Web Locks also serialize cookie changes
// across tabs, so two tabs don't accidentally replay the same refresh token.
function mutateSession<T>(task: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> =>
    navigator.locks?.request
      ? await navigator.locks.request("inventory-session", task)
      : await task();
  const result = mutationQueue.then(run, run);
  mutationQueue = result.catch(() => undefined);
  return result;
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? "Request failed.",
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export function subscribeSession(listener: (user: User | null) => void) {
  listeners.add(listener);
  if (!channel && typeof window.BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("inventory-session");
    channel.onmessage = ({ data }) => {
      if (data === "signed-out") setSession(null);
      if (data === "signed-in") {
        accessToken = null;
        void refreshSession().catch(() => setSession(null));
      }
    };
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      channel?.close();
      channel = null;
    }
  };
}

export function refreshSession(): Promise<User> {
  if (!refreshPromise) {
    refreshPromise = mutateSession(async () => {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });
      const session = await readResponse<SessionResponse>(response);
      setSession(session);
      return session.user;
    })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) setSession(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function login(username: string, password: string) {
  return mutateSession(async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const session = await readResponse<SessionResponse>(response);
    setSession(session);
    channel?.postMessage("signed-in");
    return session.user;
  });
}

export function logout() {
  return mutateSession(async () => {
    await readResponse<void>(
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }),
    );
    setSession(null);
    channel?.postMessage("signed-out");
  });
}

export async function apiRequest<T>(path: string): Promise<T> {
  if (!accessToken) await refreshSession();
  const send = () =>
    fetch(path, {
      credentials: "same-origin",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  const usedToken = accessToken;
  let response = await send();
  if (response.status === 401) {
    // Other parallel requests may have already renewed the token.
    if (accessToken === usedToken) await refreshSession();
    if (!accessToken)
      throw new ApiError(401, "UNAUTHENTICATED", "Please sign in again.");
    response = await send();
    if (response.status === 401) setSession(null);
  }
  return readResponse<T>(response);
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS")
      return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    if (error.status === 401) return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง";
    if (error.status === 403) return "คุณไม่มีสิทธิ์ทำรายการนี้";
    if (error.status === 429)
      return "มีการลองใช้งานหลายครั้ง กรุณารอสักครู่แล้วลองใหม่";
  }
  return "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่";
}
