"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const NAV = [
  { id: "home", label: "Dashboard", href: "/dashboard" },
  { id: "claims", label: "Claims History", href: "/dashboard" },
  { id: "payments", label: "Payments", href: "/dashboard" },
  { id: "profile", label: "Profile", href: "/dashboard" },
  { id: "simulator", label: "Simulator (Demo)", href: "/simulator" },
];

export default function SimulatorPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [dailyWage, setDailyWage] = useState<number>(500);
  const [tier, setTier] = useState<string>("standard");

  // Triggers
  const [temperature, setTemperature] = useState<number>(30.0);
  const [rain1h, setRain1h] = useState<number>(0.0);
  const [windSpeed, setWindSpeed] = useState<number>(5.0);
  const [aqiIndex, setAqiIndex] = useState<number>(100);
  const [tti, setTti] = useState<number>(1.0);
  const [unrestConfidence, setUnrestConfidence] = useState<number>(0.0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    predicted_premium: { weekly_premium: number; [key: string]: any } | number;
    severity: number;
    active_trigger: string;
    claim_payout: number;
    all_triggers?: { trigger_id: string; severity: number }[];
  } | null>(null);

  // Fetch user info for the header
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) setUserName(data.user.name);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const getPremiumValue = (): string => {
    if (!results) return "---";
    const p = results.predicted_premium;
    if (typeof p === "number") return p.toFixed(0);
    if (p && typeof p === "object" && typeof p.weekly_premium === "number")
      return p.weekly_premium.toFixed(0);
    return "---";
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backend/simulator/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daily_wage: dailyWage,
          tier,
          temperature,
          rain_1h: rain1h,
          wind_speed: windSpeed,
          aqi_index: aqiIndex,
          tti,
          unrest_confidence: unrestConfidence,
        }),
      });
      if (!res.ok) {
        setError(`Backend returned ${res.status}. Please try again.`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Failed to evaluate scenario:", err);
      setError("Failed to reach backend. Make sure the server is running.");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      document.cookie = "gg_token=; path=/; max-age=0";
      localStorage.removeItem("gg_token");
    } catch {
      /* ignore */
    }
    router.push("/login");
  };

  const triggerLabel = (id: string): string => {
    const map: Record<string, string> = {
      "T-01": "Heavy Rain",
      "T-02": "Extreme Heat",
      "T-03": "Severe AQI",
      "T-04": "Flood Risk",
      "T-05": "Traffic Congestion",
      "T-06": "Curfew / Unrest",
    };
    return map[id] || id;
  };

  return (
    <div className={styles.pageRoot}>
      {/* ── Header with full navigation ── */}
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <Link href="/dashboard" className={styles.brandLogo}>
            GG
          </Link>
          <Link href="/dashboard" className={styles.brandText}>
            WPIP
          </Link>
        </div>

        <nav className={styles.headerNavTabs}>
          {NAV.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`${styles.headerNavTab} ${item.id === "simulator" ? styles.headerNavTabActive : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.headerActions}>
          {userName && (
            <div className={styles.userBadge}>
              <div className={styles.userInitial}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className={styles.userName}>{userName}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutBtn}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Financial Scenario Simulator</h1>
          <p className={styles.heroSub}>
            Evaluate insurance policies based on expected weather and unrest
            conditions to understand your premium rates and maximum payout
            eligibility.
          </p>
        </div>

        <div className={styles.simulatorGrid}>
          {/* Left Panel: Inputs */}
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Configuration</h2>

            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Expected Daily Earnings (₹)</label>
                <input
                  type="number"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(Number(e.target.value))}
                  className={styles.numberInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Premium Plan</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="basic">Basic Shield</option>
                  <option value="standard">Standard Guard</option>
                  <option value="pro">Pro Protect</option>
                </select>
              </div>
            </div>

            <h2 className={styles.panelTitle}>Environmental Triggers</h2>

            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Temperature (°C): {temperature}</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>AQI Index: {aqiIndex}</label>
                <input
                  type="range"
                  min="10"
                  max="600"
                  step="1"
                  value={aqiIndex}
                  onChange={(e) => setAqiIndex(parseInt(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Rainfall (mm/h): {rain1h}</label>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="1"
                  value={rain1h}
                  onChange={(e) => setRain1h(parseFloat(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Traffic Congestion (TTI): {tti.toFixed(2)}</label>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={tti}
                  onChange={(e) => setTti(parseFloat(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div
                className={styles.inputGroup}
                style={{ gridColumn: "1 / -1" }}
              >
                <label>
                  Curfew &amp; Unrest Risk (NLP Confidence):{" "}
                  {(unrestConfidence * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={unrestConfidence}
                  onChange={(e) =>
                    setUnrestConfidence(parseFloat(e.target.value))
                  }
                  className={styles.sliderInput}
                />
              </div>
            </div>

            <button
              className={styles.evalBtn}
              onClick={handleEvaluate}
              disabled={loading}
            >
              {loading ? "Evaluating..." : "Run Simulation"}
            </button>

            {error && <div className={styles.errorMsg}>{error}</div>}
          </div>

          {/* Right Panel: Results Output */}
          <div className={styles.resultAside}>
            <div className={styles.resultCard}>
              <div className={styles.resultCardLabel}>
                Calculated Weekly Premium
              </div>
              <div
                className={`${styles.resultCardAmount} ${styles.premiumAmount}`}
              >
                ₹{getPremiumValue()}
              </div>
              <div className={styles.resultCardMeta}>
                Based on ML risk assessment
              </div>
            </div>

            <div className={styles.resultCard}>
              <div className={styles.resultCardLabel}>Trigger Severity</div>
              <div
                className={`${styles.resultCardAmount} ${styles.severityAmount}`}
              >
                {results ? `${(results.severity * 100).toFixed(0)}%` : "---"}
              </div>
              <div className={styles.resultCardMeta}>
                Fuzzy mathematical confidence
              </div>
              {results?.active_trigger && results.active_trigger !== "None" && (
                <div className={styles.triggerBadge}>
                  {results.active_trigger} —{" "}
                  {triggerLabel(results.active_trigger)} BREACHED
                </div>
              )}
            </div>

            <div className={styles.resultCard}>
              <div className={styles.resultCardLabel}>
                Expected Claim Payout
              </div>
              <div
                className={`${styles.resultCardAmount} ${styles.payoutAmount}`}
              >
                ₹{results ? results.claim_payout.toFixed(0) : "---"}
              </div>
              <div className={styles.resultCardMeta}>
                Max eligible daily compensation
              </div>
            </div>

            {/* All active triggers breakdown */}
            {results?.all_triggers && results.all_triggers.length > 0 && (
              <div className={styles.resultCard}>
                <div className={styles.resultCardLabel}>
                  Active Triggers Breakdown
                </div>
                <div className={styles.triggerList}>
                  {results.all_triggers.map((t) => (
                    <div key={t.trigger_id} className={styles.triggerRow}>
                      <span className={styles.triggerRowId}>
                        {t.trigger_id}
                      </span>
                      <span className={styles.triggerRowName}>
                        {triggerLabel(t.trigger_id)}
                      </span>
                      <span className={styles.triggerRowScore}>
                        {(t.severity * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
