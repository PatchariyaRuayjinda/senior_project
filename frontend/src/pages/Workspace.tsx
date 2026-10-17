import { useEffect, useState } from "react";
import { apiRequest, errorMessage, logout, type User } from "../auth/client";

const roleLabel = (role: User["role"]) =>
  role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่";

export function Workspace({ user }: { user: User }) {
  const [page, setPage] = useState<"account" | "users">("account");
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (page !== "users") return;
    let active = true;
    setError("");
    setUsers(null);
    apiRequest<{ users: User[] }>("/api/admin/users")
      .then((result) => {
        if (active) setUsers(result.users);
      })
      .catch((failure) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, [page]);

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="brand-icon" aria-hidden="true">
            ▦
          </span>{" "}
          inventory<span className="brand-dot">.</span>
        </a>
        <span className="eyebrow navigation-label">WORKSPACE</span>
        <nav aria-label="เมนูหลัก">
          <button
            className={page === "account" ? "nav-button active" : "nav-button"}
            onClick={() => setPage("account")}
          >
            บัญชีของฉัน <span aria-hidden="true">↗</span>
          </button>
          {user.role === "admin" && (
            <button
              className={page === "users" ? "nav-button active" : "nav-button"}
              onClick={() => setPage("users")}
            >
              ผู้ใช้งาน <span aria-hidden="true">↗</span>
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{user.username}</strong>
            <span>{roleLabel(user.role)}</span>
          </div>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="workspace-header">
          <span>
            พื้นที่ทำงาน / {page === "account" ? "บัญชีของฉัน" : "ผู้ใช้งาน"}
          </span>
          <button
            className="button secondary"
            onClick={signOut}
            disabled={busy}
          >
            {busy ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
          </button>
        </header>
        <div className="workspace-content">
          <span className="eyebrow muted">
            {page === "account" ? "YOUR ACCOUNT" : "PEOPLE"}
          </span>
          <h1>
            {page === "account" ? `สวัสดี, ${user.username}` : "ผู้ใช้งาน"}
          </h1>
          <p className="muted">
            {page === "account"
              ? "ยินดีต้อนรับสู่พื้นที่ทำงานของคุณ"
              : "บัญชีผู้ใช้และสิทธิ์การใช้งานในระบบ"}
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {page === "account" ? (
            <section className="content-card" aria-label="ข้อมูลบัญชี">
              <div className="card-title">
                <h2>ข้อมูลบัญชี</h2>
                <span className="status-pill">เข้าสู่ระบบแล้ว</span>
              </div>
              <dl>
                <div>
                  <dt>ชื่อผู้ใช้</dt>
                  <dd>{user.username}</dd>
                </div>
                <div>
                  <dt>สิทธิ์การใช้งาน</dt>
                  <dd>{roleLabel(user.role)}</dd>
                </div>
              </dl>
            </section>
          ) : (
            <section className="content-card" aria-label="รายชื่อผู้ใช้งาน">
              {!users && !error && <p role="status">กำลังโหลดผู้ใช้งาน…</p>}
              {users && (
                <table>
                  <thead>
                    <tr>
                      <th>ชื่อผู้ใช้</th>
                      <th>สิทธิ์การใช้งาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((account) => (
                      <tr key={account.id}>
                        <td>{account.username}</td>
                        <td>
                          <span className="role-pill">
                            {roleLabel(account.role)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
