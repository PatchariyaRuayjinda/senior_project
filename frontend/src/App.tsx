import { App as AntApp, ConfigProvider } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  ApiError,
  errorMessage,
  refreshSession,
  subscribeSession,
  type User,
} from "./features/auth/api/client";
import { Login } from "./pages/Login";
import { clearBlue } from "./theme/clearBlue";
const Workspace = lazy(() =>
  import("./pages/Workspace").then((module) => ({ default: module.Workspace })),
);
dayjs.locale("th");

export default function App() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        ...clearBlue,
        token: { ...clearBlue.token, motion: !reducedMotion },
      }}
    >
      <AntApp>
        <Suspense
          fallback={
            <main className="loading-screen" role="status">
              กำลังเตรียมพื้นที่ทำงาน…
            </main>
          }
        >
          <SessionApp />
        </Suspense>
      </AntApp>
    </ConfigProvider>
  );
}

function SessionApp() {
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
    if (!user) document.title = "Inventory · เข้าสู่ระบบ";
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
