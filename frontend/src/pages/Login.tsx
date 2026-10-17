import { useState, type FormEvent } from "react";
import { errorMessage, login } from "../auth/client";

export function Login({ initialError }: { initialError?: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-intro" aria-label="Inventory">
        <a className="brand" href="/" aria-label="Inventory หน้าหลัก">
          <span className="brand-icon" aria-hidden="true">
            ▦
          </span>{" "}
          inventory<span className="brand-dot">.</span>
        </a>
        <div className="intro-copy">
          <span className="eyebrow">A LITTLE MORE ORGANIZED</span>
          <h1>
            ทุกอย่าง
            <br />
            เข้าที่เข้าทาง<span className="accent">.</span>
          </h1>
          <p>
            พื้นที่สำหรับดูแลคลังสินค้า
            <br />
            เริ่มต้นวันทำงานด้วยการเข้าสู่ระบบของคุณ
          </p>
        </div>
        <div className="shelf-art" aria-hidden="true">
          <div className="box box-one">
            <span>01</span>
          </div>
          <div className="box box-two">
            <span>02</span>
          </div>
          <div className="box box-three">
            <span>03</span>
          </div>
          <div className="shelf-line" />
        </div>
        <span className="intro-footer">A PLACE FOR EVERYTHING.</span>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow muted">WELCOME BACK</span>
          <h2>เข้าสู่ระบบ</h2>
          <p className="muted login-description">
            ยินดีต้อนรับกลับมา ใช้บัญชีที่ได้รับจากผู้ดูแลระบบ
          </p>
          <form onSubmit={submit} aria-label="เข้าสู่ระบบ">
            <label htmlFor="username">ชื่อผู้ใช้</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={3}
              maxLength={64}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={busy}
              placeholder="กรอกชื่อผู้ใช้"
            />
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              placeholder="กรอกรหัสผ่าน"
            />
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button
              className="button primary login-button"
              disabled={busy}
              type="submit"
            >
              {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
          <p className="account-help">
            ต้องการบัญชีผู้ใช้? ติดต่อผู้ดูแลระบบของคุณ
          </p>
        </div>
        <footer className="login-footer">
          INVENTORY WORKSPACE <span>เรียบง่าย เป็นระเบียบ พร้อมเริ่มต้น</span>
        </footer>
      </section>
    </main>
  );
}
