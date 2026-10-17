import { useEffect, useState } from "react";
import {
  ApiError,
  errorMessage,
  refreshSession,
  subscribeSession,
  type User,
} from "./auth/client";
import { Login } from "./pages/Login";
import { Workspace } from "./pages/Workspace";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSession(setUser);
    refreshSession()
      .catch((failure: unknown) => {
        if (active && !(failure instanceof ApiError && failure.status === 401))
          setError(errorMessage(failure));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.title = user
      ? "Inventory · พื้นที่ทำงาน"
      : "Inventory · เข้าสู่ระบบ";
  }, [user]);

  if (loading)
    return (
      <main className="loading-screen" role="status">
        กำลังเตรียมพื้นที่ทำงาน…
      </main>
    );
  return user ? (
    <Workspace key={user.id} user={user} />
  ) : (
    <Login initialError={error} />
  );
}
