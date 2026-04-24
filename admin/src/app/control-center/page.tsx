"use client";
import { useEffect, useRef, useState } from "react";

type PlatformStat = {
  platform: string;
  worker_count: number;
  avg_earnings: number;
  min_earnings: number;
  max_earnings: number;
  avg_deliveries: number;
  total_earnings: number;
};

type DataSummary = {
  date: string;
  platforms: PlatformStat[];
  total_workers: number;
  overall_avg_earnings: number;
};

type ModelStatus = {
  model_loaded: boolean;
  metadata: {
    rmse: number;
    n_samples: number;
    trained_at: string;
    features: string[];
  } | null;
  tiers: Record<string, { rate: number; min: number; max: number; max_payout: number }>;
};

type PremiumResult = {
  weekly_premium: number;
  weekly_premium_autopay: number;
  raw_prediction: number;
  tier: string;
  max_payout: number;
  weather_risk: number;
  city_risk: number;
  weekly_earnings_est: number;
  history_days: number;
};

const PLATFORMS = [
  "swiggy", "zomato", "amazon_flex", "blinkit",
  "zepto", "meesho", "porter", "dunzo",
];
const CITIES = ["Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune"];

const IconRefresh = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <path d="M12.25 7A5.25 5.25 0 1 1 7 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 1.75L9.5 4.25 7 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCpu = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6 4V2M10 4V2M6 14v-2M10 14v-2M4 6H2M4 10H2M14 6h-2M14 10h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconDatabase = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <ellipse cx="8" cy="4" rx="5.5" ry="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.5 4v4c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.5 8v4c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V8" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const IconZap = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <path d="M9 2L3 9h5l-1 5 6-7H8l1-5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <circle cx="6" cy="6" r="4.5" stroke="#94A3B8" strokeWidth="1.3" />
    <path d="M10 10l2.5 2.5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export default function ControlCenterPage() {
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [retrainLogs, setRetrainLogs] = useState<string[]>([]);
  const [retrainStatus, setRetrainStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Income adjustment
  const [adjPlatform, setAdjPlatform] = useState("");
  const [adjEarnings, setAdjEarnings] = useState("1.0");
  const [adjDeliveries, setAdjDeliveries] = useState("1.0");

  // Premium test
  const [testWorkerId, setTestWorkerId] = useState("");
  const [testCity, setTestCity] = useState("Chennai");
  const [testTier, setTestTier] = useState("standard");
  const [premiumResult, setPremiumResult] = useState<PremiumResult | null>(null);

  useEffect(() => {
    refresh();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [summaryRes, modelRes] = await Promise.all([
        fetch("/api/backend/admin/data-summary"),
        fetch("/api/backend/model/status"),
      ]);
      if (summaryRes.ok) setDataSummary(await summaryRes.json());
      if (modelRes.ok) setModelStatus(await modelRes.json());
    } catch {
      setActionErr("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setActionLoading("Retrain Model");
    setActionMsg("");
    setActionErr("");
    setRetrainLogs(["Starting retrain…"]);
    setRetrainStatus("running");
    try {
      const res = await fetch("/api/backend/model/retrain", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        setActionErr(data.message || "Failed to start retrain.");
        setRetrainStatus("error");
        setActionLoading("");
        return;
      }
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch("/api/backend/model/retrain/logs");
          const d = await r.json();
          setRetrainLogs(d.logs?.length ? d.logs : ["Waiting for logs…"]);
          if (!d.running) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setActionLoading("");
            if (d.error) {
              setRetrainStatus("error");
              setActionErr(`Retrain failed: ${d.error}`);
            } else {
              setRetrainStatus("done");
              setActionMsg("Retrain completed successfully.");
              refresh();
            }
          }
        } catch { /* backend blip — keep polling */ }
      }, 1500);
    } catch {
      setActionErr("Backend unavailable.");
      setRetrainStatus("error");
      setActionLoading("");
    }
  };

  const doAction = async (label: string, url: string, method = "POST", body?: object) => {
    setActionLoading(label);
    setActionMsg("");
    setActionErr("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setActionErr(data.error || `${label} failed.`);
      } else {
        setActionMsg(data.message || `${label} completed.`);
        refresh();
      }
    } catch {
      setActionErr(`${label} failed — backend may be offline.`);
    } finally {
      setActionLoading("");
    }
  };

  const handleAdjustIncome = () => {
    doAction("Adjust Income", "/api/backend/admin/adjust-income", "POST", {
      platform: adjPlatform || null,
      earnings_multiplier: parseFloat(adjEarnings) || 1.0,
      deliveries_multiplier: parseFloat(adjDeliveries) || 1.0,
    });
  };

  const handleTestPremium = async () => {
    if (!testWorkerId) { setActionErr("Enter a worker ID to test."); return; }
    setActionLoading("Test Premium");
    setActionMsg("");
    setActionErr("");
    setPremiumResult(null);
    try {
      const res = await fetch("/api/backend/premium/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_id: testWorkerId, city: testCity, tier: testTier }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setActionErr(data.error || "Premium prediction failed.");
      } else {
        setPremiumResult(data);
        setActionMsg("Premium computed successfully.");
      }
    } catch {
      setActionErr("Backend unavailable.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">Control Center</h1>
          <p className="pageSubtitle">
            Monitor generated data, tune income multipliers, retrain models, and validate premium predictions.
          </p>
        </div>
        <div className="pageActions">
          <button type="button" className="btn btnSecondary" onClick={refresh}>
            <IconRefresh /> Refresh Metrics
          </button>
        </div>
      </div>

      {actionMsg && <div className="alertSuccess">{actionMsg}</div>}
      {actionErr && <div className="alertError">{actionErr}</div>}

      {/* Quick Action Cards */}
      <div
        className="gridStats"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}
      >
        {[
          {
            icon: <IconDatabase />,
            iconBg: "#DBEAFE",
            iconColor: "#2563EB",
            title: "Generate Data",
            desc: "Trigger one cycle of synthetic data generation for all platforms.",
            btn: actionLoading === "Generate Data" ? "Generating…" : "Generate Now",
            onClick: () => doAction("Generate Data", "/api/backend/admin/generate-data"),
          },
          {
            icon: <IconCpu />,
            iconBg: "#DCFCE7",
            iconColor: "#16A34A",
            title: "Retrain Model",
            desc: "Retrain the XGBoost premium model on latest data. Takes 10–30 seconds.",
            btn: actionLoading === "Retrain Model" ? "Training…" : "Retrain Now",
            onClick: handleRetrain,
          },
          {
            icon: <IconRefresh />,
            iconBg: "#EDE9FE",
            iconColor: "#7C3AED",
            title: "Refresh All",
            desc: "Reload data summary and model status from the backend.",
            btn: "Refresh",
            onClick: refresh,
          },
        ].map(({ icon, iconBg, iconColor, title, desc, btn, onClick }) => (
          <div key={title} className="card cardPad">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: iconBg,
                  color: iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--white)" }}>{title}</div>
                <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btnPrimary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={!!actionLoading}
              onClick={onClick}
            >
              {btn}
            </button>
          </div>
        ))}
      </div>

      {/* Retrain Logs */}
      {retrainStatus !== "idle" && (
        <div className="card cardPad" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Retrain Logs</span>
              {retrainStatus === "running" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#16A34A",
                    background: "#DCFCE7",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  RUNNING
                </span>
              )}
              {retrainStatus === "done" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#15803D",
                    background: "#DCFCE7",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  DONE
                </span>
              )}
              {retrainStatus === "error" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#991B1B",
                    background: "#FEE2E2",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  ERROR
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRetrainStatus("idle")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: "var(--faint)",
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              ×
            </button>
          </div>
          {retrainStatus === "running" && (
            <div
              style={{
                height: 4,
                background: "var(--elevated)",
                borderRadius: 4,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #2563EB, #16A34A)",
                  borderRadius: 4,
                  animation: "cc-progress 2s ease-in-out infinite",
                  width: "60%",
                }}
              />
            </div>
          )}
          <div className="logBox">
            {retrainLogs.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.includes("ERROR")
                    ? "#F87171"
                    : line.includes("Done") || line.includes("better")
                    ? "#4ADE80"
                    : "#94A3B8",
                }}
              >
                {line}
              </div>
            ))}
            {retrainStatus === "running" && (
              <div style={{ color: "#60A5FA" }}>_</div>
            )}
          </div>
          <style>{`
            @keyframes cc-progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading backend data…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ML Model Status */}
          <div className="card">
            <div className="sectionHead">
              <div className="sectionTitle">ML Model Status</div>
              <span
                className={`badge ${modelStatus?.model_loaded ? "badgeGreen" : "badgeAmber"}`}
              >
                {modelStatus?.model_loaded ? "Loaded" : "Formula Fallback"}
              </span>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}
              >
                {[
                  ["RMSE", modelStatus?.metadata ? modelStatus.metadata.rmse.toFixed(2) : "N/A"],
                  ["Training Samples", modelStatus?.metadata?.n_samples?.toLocaleString() || "N/A"],
                  ["Last Trained", modelStatus?.metadata?.trained_at
                    ? new Date(modelStatus.metadata.trained_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Never"],
                  ["Model Loaded", modelStatus?.model_loaded ? "Yes" : "No"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="statLabel">{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--white)" }}>{value}</div>
                  </div>
                ))}
              </div>

              {modelStatus?.tiers && (
                <>
                  <div
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}
                  >
                    Tier Configuration
                  </div>
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Tier</th>
                          <th>Rate</th>
                          <th>Min Premium</th>
                          <th>Max Premium</th>
                          <th>Max Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(modelStatus.tiers).map(([tier, cfg]) => (
                          <tr key={tier}>
                            <td style={{ fontWeight: 600 }}>
                              {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </td>
                            <td style={{ color: "var(--muted)" }}>{(cfg.rate * 100).toFixed(1)}%</td>
                            <td style={{ color: "var(--muted)" }}>₹{cfg.min}</td>
                            <td style={{ color: "var(--muted)" }}>₹{cfg.max}</td>
                            <td style={{ fontWeight: 600 }}>₹{cfg.max_payout?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Platform Data Summary */}
          {dataSummary && (
            <div className="card">
              <div className="sectionHead">
                <div className="sectionTitle">Platform Data Summary</div>
                <div style={{ fontSize: 12, color: "var(--faint)" }}>
                  {dataSummary.date} · {dataSummary.total_workers.toLocaleString()} total workers · avg ₹{dataSummary.overall_avg_earnings?.toFixed(0)}/day
                </div>
              </div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Workers</th>
                      <th>Avg Earnings</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Avg Deliveries</th>
                      <th>Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataSummary.platforms.map((p) => (
                      <tr key={p.platform}>
                        <td style={{ fontWeight: 600 }}>
                          {p.platform.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </td>
                        <td style={{ color: "var(--muted)" }}>{p.worker_count?.toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>₹{p.avg_earnings?.toFixed(0)}</td>
                        <td style={{ color: "var(--faint)" }}>₹{p.min_earnings?.toFixed(0)}</td>
                        <td style={{ color: "var(--faint)" }}>₹{p.max_earnings?.toFixed(0)}</td>
                        <td style={{ color: "var(--muted)" }}>{p.avg_deliveries?.toFixed(1)}</td>
                        <td style={{ fontWeight: 600 }}>₹{p.total_earnings?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom row: Adjust Income + Test Premium */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Adjust Income */}
            <div className="card cardPad">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <IconZap />
                <div className="sectionTitle">Adjust Income Data</div>
              </div>
              <p style={{ fontSize: 12, color: "var(--faint)", marginBottom: 18, lineHeight: 1.5 }}>
                Apply multipliers to earnings and deliveries for testing model responses.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                    Platform (leave blank for all)
                  </label>
                  <select
                    className="select"
                    value={adjPlatform}
                    onChange={(e) => setAdjPlatform(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">All Platforms</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                      Earnings Multiplier
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={adjEarnings}
                      onChange={(e) => setAdjEarnings(e.target.value)}
                      step="0.1"
                      min="0.1"
                      max="5"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                      Deliveries Multiplier
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={adjDeliveries}
                      onChange={(e) => setAdjDeliveries(e.target.value)}
                      step="0.1"
                      min="0.1"
                      max="5"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btnPrimary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                  disabled={actionLoading === "Adjust Income"}
                  onClick={handleAdjustIncome}
                >
                  {actionLoading === "Adjust Income" ? "Applying…" : "Apply Adjustments"}
                </button>
              </div>
            </div>

            {/* Test Premium */}
            <div className="card cardPad">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <IconSearch />
                <div className="sectionTitle">Test Premium Prediction</div>
              </div>
              <p style={{ fontSize: 12, color: "var(--faint)", marginBottom: 18, lineHeight: 1.5 }}>
                Compute insurance premium for a specific worker ID, city, and tier.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                    Worker / Delivery ID
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter delivery ID…"
                    value={testWorkerId}
                    onChange={(e) => setTestWorkerId(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                      City
                    </label>
                    <select
                      className="select"
                      value={testCity}
                      onChange={(e) => setTestCity(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      {CITIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                      Tier
                    </label>
                    <select
                      className="select"
                      value={testTier}
                      onChange={(e) => setTestTier(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="basic">Basic</option>
                      <option value="standard">Standard</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btnPrimary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                  disabled={actionLoading === "Test Premium"}
                  onClick={handleTestPremium}
                >
                  {actionLoading === "Test Premium" ? "Computing…" : "Compute Premium"}
                </button>

                {premiumResult && (
                  <div
                    style={{
                      marginTop: 8,
                      background: "var(--elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--faint)", marginBottom: 10 }}
                    >
                      Result
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                      {[
                        ["Weekly Premium", `₹${premiumResult.weekly_premium?.toFixed(2)}`],
                        ["Autopay Premium", `₹${premiumResult.weekly_premium_autopay?.toFixed(2)}`],
                        ["Max Payout", `₹${premiumResult.max_payout?.toLocaleString()}`],
                        ["Tier", premiumResult.tier],
                        ["Weather Risk", `${(premiumResult.weather_risk * 100).toFixed(0)}%`],
                        ["City Risk", `${(premiumResult.city_risk * 100).toFixed(0)}%`],
                        ["Weekly Earnings Est.", `₹${premiumResult.weekly_earnings_est?.toFixed(0)}`],
                        ["History Days", premiumResult.history_days?.toString()],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
