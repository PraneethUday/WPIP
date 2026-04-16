"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const features = [
  {
    title: "Weather-Adjusted Premiums",
    desc: "Premiums recalculate weekly based on rain, AQI, and disruption risk in your city.",
  },
  {
    title: "Automatic Claim Payouts",
    desc: "Disruption events trigger payouts directly — no forms, no waiting, no paperwork.",
  },
  {
    title: "Works Across All Platforms",
    desc: "One policy covers Swiggy, Zomato, Blinkit, Zepto, Porter and more simultaneously.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      localStorage.setItem("gg_token", data.token);
      localStorage.setItem("gg_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>GG</div>
          <span className={styles.brandName}>GigGuard</span>
        </div>
        <div className={styles.secureLabel}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          SECURE ENVIRONMENT
        </div>
      </header>

      {/* ── Main ── */}
      <main className={styles.main}>
        <div className={styles.shell}>
          {/* ── Left panel ── */}
          <div className={styles.leftPanel}>
            <h2 className={styles.leftHeading}>
              Income protection for every delivery, every week.
            </h2>
            <p className={styles.leftSub}>
              GigGuard insures delivery workers against weather disruptions,
              platform downtime, and income loss — starting at ₹40/week.
            </p>
            <div className={styles.featureList}>
              {features.map((f) => (
                <div key={f.title} className={styles.featureItem}>
                  <div className={styles.featureCheck}>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#5CD4BE"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className={styles.featureTitle}>{f.title}</p>
                    <p className={styles.featureDesc}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className={styles.rightPanel}>
            {/* Tabs */}
            <nav className={styles.tabBar}>
              <button
                type="button"
                className={`${styles.tabBtn} ${styles.tabBtnActive}`}
              >
                Log In
              </button>
              <button
                type="button"
                className={styles.tabBtn}
                onClick={() => router.push("/register")}
              >
                Register
              </button>
            </nav>

            <h1 className={styles.formHeading}>Welcome Back</h1>
            <p className={styles.formSub}>
              Please enter your credentials to access your GigGuard account.
            </p>

            {error && <div className={styles.errorBox}>{error}</div>}

            <div className={styles.fields}>
              <div>
                <label className={styles.fieldLabel}>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter the Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className={styles.input}
                />
              </div>

              <div>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel}>Password</label>
                  <button type="button" className={styles.forgotLink}>
                    Forgot?
                  </button>
                </div>
                <div className={styles.inputWrap}>
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className={`${styles.input} ${styles.inputWithBtn}`}
                  />
                  <button
                    type="button"
                    className={styles.showHideBtn}
                    onClick={() => setShowPwd((v) => !v)}
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? "Signing in..." : "Access Portal"}
            </button>

            <p className={styles.switchText}>
              New to GigGuard?{" "}
              <span
                className={styles.switchLink}
                onClick={() => router.push("/register")}
              >
                Register and get insured today!
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerCopy}>
          GigGuard © 2024. All rights reserved.
        </span>
        <div className={styles.footerLinks}>
          {["Privacy Policy", "Contact Support", "Security"].map((l) => (
            <button key={l} type="button" className={styles.footerLink}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
