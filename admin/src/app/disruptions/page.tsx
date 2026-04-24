"use client";
import { useEffect, useState } from "react";

type WeatherInfo = {
  temperature: number;
  humidity: number;
  wind_speed: number;
  rain_1h: number;
  rain_3h: number;
  aqi_index: number;
  weather_main: string;
  is_heavy_rain: boolean;
  is_extreme_heat: boolean;
  is_severe_aqi: boolean;
  is_flood_risk: boolean;
};

type TriggerFired = {
  trigger_id: string;
  trigger_type: string;
  description: string;
  severity: string;
};

type CityStatus = {
  weather: WeatherInfo;
  triggers_fired: TriggerFired[];
  has_active_disruption: boolean;
};

type DisruptionEvent = {
  id: string;
  trigger_id: string;
  trigger_type: string;
  city: string;
  severity: string;
  description: string;
  temperature: number;
  rain_1h: number;
  aqi_index: number;
  status: string;
  event_date: string;
  created_at: string;
};

type Claim = {
  id: string;
  claim_number: string;
  worker_id: string;
  platform: string;
  city: string;
  trigger_type: string;
  payout_amount: number;
  daily_wage_est: number;
  fraud_score: number;
  payout_status: string;
  status: string;
  created_at: string;
};

const WEATHER_MARKER: Record<string, string> = {
  Clear: "CLR",
  Clouds: "CLD",
  Rain: "RAN",
  Drizzle: "DRZ",
  Thunderstorm: "THN",
  Snow: "SNW",
  Mist: "MST",
  Haze: "HAZ",
  Fog: "FOG",
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  extreme: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  severe:  { bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" },
  moderate:{ bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
};

const TRIGGER_LABELS: Record<string, string> = {
  "T-01": "T-01 Heavy Rain",
  "T-02": "T-02 Extreme Heat",
  "T-03": "T-03 Severe AQI",
  "T-04": "T-04 Flood",
};

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  heavy_rain: "Heavy Rain",
  extreme_heat: "Extreme Heat",
  severe_aqi: "Severe AQI",
  flood: "Flood",
};

const CITIES = ["Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune"];

const IconRefresh = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <path d="M12.25 7A5.25 5.25 0 1 1 7 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 1.75L9.5 4.25 7 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconMapPin = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 13 13">
    <path d="M6.5 1A3.5 3.5 0 0 0 3 4.5C3 7.5 6.5 12 6.5 12S10 7.5 10 4.5A3.5 3.5 0 0 0 6.5 1z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="6.5" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const IconFire = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <path d="M7 1C7 1 4 4 4 7.5C4 9.433 5.343 11 7 11C8.657 11 10 9.433 10 7.5C10 6.5 9.5 5.5 9 5C9 5 9 7 7.5 7C6 7 7 4 7 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "approved" || s === "paid") return <span className="badge badgeGreen">{status}</span>;
  if (s === "rejected") return <span className="badge badgeRed">{status}</span>;
  if (s === "under_review") return <span className="badge badgeBlue">Under Review</span>;
  if (s === "pending") return <span className="badge badgeAmber">Pending</span>;
  if (s === "active") return <span className="badge badgeRed">Active</span>;
  if (s === "resolved") return <span className="badge badgeGreen">Resolved</span>;
  if (s === "auto_initiated") return <span className="badge badgeBlue">Auto-initiated</span>;
  return <span className="badge badgeGray">{status}</span>;
}

export default function DisruptionsPage() {
  const [triggerStatus, setTriggerStatus] = useState<Record<string, CityStatus>>({});
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [testCity, setTestCity] = useState("Chennai");
  const [testTrigger, setTestTrigger] = useState("T-01");
  const [firing, setFiring] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "claims">("overview");

  useEffect(() => { refresh(); }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [tsRes, dRes, cRes] = await Promise.all([
        fetch("/api/backend/triggers/status"),
        fetch("/api/backend/disruptions?limit=50"),
        fetch("/api/backend/claims?limit=100"),
      ]);
      if (tsRes.ok) setTriggerStatus(await tsRes.json());
      if (dRes.ok) { const d = await dRes.json(); setDisruptions(d.data || []); }
      if (cRes.ok) { const c = await cRes.json(); setClaims(c.data || []); }
    } catch {
      setActionErr("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestFire = async () => {
    setFiring(true);
    setActionMsg("");
    setActionErr("");
    try {
      const res = await fetch("/api/backend/triggers/test-fire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: testCity, trigger_id: testTrigger }),
      });
      const data = await res.json();
      if (data.error) {
        setActionErr(data.error);
      } else {
        setActionMsg(
          `Trigger ${data.trigger_id} fired in ${data.city}. Claims are being auto-created — refreshing in 6 seconds…`
        );
        // Claims are created in background — wait 6s then refresh to show them
        setTimeout(() => {
          refresh();
          setActionMsg(`Trigger ${data.trigger_id} fired in ${data.city}. Claims created and visible below.`);
        }, 6000);
      }
    } catch {
      setActionErr("Backend unavailable.");
    } finally {
      setFiring(false);
    }
  };

  const cities = Object.keys(triggerStatus);
  const activeCities = cities.filter((c) => triggerStatus[c].has_active_disruption);
  const totalClaims = claims.length;
  const totalPayout = claims.reduce((s, c) => s + (c.payout_amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">Parametric Trigger Monitor</h1>
          <p className="pageSubtitle">
            Real-time weather monitoring, disruption events, and automated claims supervision.
          </p>
        </div>
        <div className="pageActions">
          <button type="button" className="btn btnSecondary" onClick={refresh}>
            <IconRefresh /> Refresh Monitor
          </button>
        </div>
      </div>

      {actionMsg && <div className="alertSuccess">{actionMsg}</div>}
      {actionErr && <div className="alertError">{actionErr}</div>}

      {/* Stats */}
      <div
        className="gridStats"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}
      >
        {[
          { label: "Monitored Cities", value: loading ? "—" : cities.length.toString() },
          {
            label: "Active Disruptions",
            value: loading ? "—" : activeCities.length.toString(),
          },
          { label: "Total Claims", value: loading ? "—" : totalClaims.toString() },
          { label: "Total Payout", value: loading ? "—" : `₹${totalPayout.toLocaleString("en-IN")}` },
        ].map(({ label, value }) => (
          <div key={label} className="statCard">
            <div className="statLabel">{label}</div>
            <div className="statValue" style={{ fontSize: 24 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`tabBtn ${activeTab === "overview" ? "tabBtnActive" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Weather & Triggers
        </button>
        <button
          type="button"
          className={`tabBtn ${activeTab === "claims" ? "tabBtnActive" : ""}`}
          onClick={() => setActiveTab("claims")}
        >
          Triggered Claims ({totalClaims})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading trigger data…</div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
              {/* Left: weather grid + disruption events */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Live Weather Grid */}
                <div className="card cardPad">
                  <div className="sectionTitle" style={{ marginBottom: 16 }}>
                    Live Weather & Trigger Status
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {cities.map((city) => {
                      const cs = triggerStatus[city];
                      const w = cs.weather;
                      const marker = WEATHER_MARKER[w.weather_main] || "WTH";
                      return (
                        <div
                          key={city}
                          style={{
                            borderRadius: 10,
                            border: cs.has_active_disruption
                              ? "2px solid #FCA5A5"
                              : "1px solid var(--border)",
                            padding: "14px 16px",
                            background: cs.has_active_disruption ? "#FEF2F2" : "var(--elevated)",
                            position: "relative",
                          }}
                        >
                          {cs.has_active_disruption && (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                background: "#DC2626",
                                color: "#fff",
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "0 8px 0 8px",
                                letterSpacing: "0.06em",
                              }}
                            >
                              ALERT
                            </div>
                          )}

                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                border: "1px solid var(--border)",
                                borderRadius: 5,
                                padding: "4px 6px",
                                color: "var(--muted)",
                                background: "var(--card)",
                              }}
                            >
                              {marker}
                            </span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--white)" }}>
                                {city}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--faint)" }}>
                                {w.weather_main}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", fontSize: 11 }}>
                            {[
                              ["Temp", `${w.temperature.toFixed(1)}°C`],
                              ["Rain 1h", `${w.rain_1h}mm`],
                              ["AQI", w.aqi_index?.toString() || "—"],
                              ["Wind", `${w.wind_speed}m/s`],
                            ].map(([k, v]) => (
                              <div key={k} style={{ color: "var(--faint)" }}>
                                {k}: <strong style={{ color: "var(--muted)" }}>{v}</strong>
                              </div>
                            ))}
                          </div>

                          {cs.triggers_fired.length > 0 && (
                            <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {cs.triggers_fired.map((tf) => {
                                const sc = SEVERITY_COLORS[tf.severity] || SEVERITY_COLORS.moderate;
                                return (
                                  <span
                                    key={tf.trigger_id}
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      background: sc.bg,
                                      color: sc.text,
                                      border: `1px solid ${sc.border}`,
                                      letterSpacing: "0.04em",
                                    }}
                                  >
                                    {tf.trigger_id} · {tf.severity.toUpperCase()}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {cities.length === 0 && (
                      <div className="empty" style={{ gridColumn: "1 / -1" }}>
                        No city data available — is the backend running?
                      </div>
                    )}
                  </div>
                </div>

                {/* Disruption Events History */}
                <div className="card">
                  <div className="sectionHead">
                    <div className="sectionTitle">Disruption Events</div>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--faint)",
                        background: "var(--elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: 20,
                        padding: "2px 10px",
                      }}
                    >
                      {disruptions.length} events
                    </span>
                  </div>
                  {disruptions.length === 0 ? (
                    <div className="empty">No disruption events recorded yet.</div>
                  ) : (
                    <div className="tableWrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>City</th>
                            <th>Trigger</th>
                            <th>Severity</th>
                            <th>Temp</th>
                            <th>Rain 1h</th>
                            <th>AQI</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disruptions.map((d) => {
                            const sc = SEVERITY_COLORS[d.severity] || SEVERITY_COLORS.moderate;
                            return (
                              <tr key={d.id}>
                                <td style={{ fontSize: 12, color: "var(--faint)", whiteSpace: "nowrap" }}>
                                  {new Date(d.event_date || d.created_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <IconMapPin />
                                    <span style={{ fontWeight: 600 }}>{d.city}</span>
                                  </div>
                                </td>
                                <td style={{ fontSize: 12, color: "var(--muted)" }}>
                                  <span className="mono" style={{ fontSize: 11 }}>{d.trigger_id}</span>
                                  <div style={{ fontSize: 11, color: "var(--faint)" }}>
                                    {TRIGGER_TYPE_LABELS[d.trigger_type] || d.trigger_type}
                                  </div>
                                </td>
                                <td>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      background: sc.bg,
                                      color: sc.text,
                                      border: `1px solid ${sc.border}`,
                                    }}
                                  >
                                    {d.severity?.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ fontSize: 12, color: "var(--muted)" }}>
                                  {d.temperature?.toFixed(1)}°C
                                </td>
                                <td style={{ fontSize: 12, color: "var(--muted)" }}>
                                  {d.rain_1h}mm
                                </td>
                                <td style={{ fontSize: 12, color: "var(--muted)" }}>
                                  {d.aqi_index || "—"}
                                </td>
                                <td>
                                  <StatusBadge status={d.status} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Test Fire panel */}
              <div className="card cardPad">
                <div className="sectionTitle" style={{ marginBottom: 4 }}>Test Fire Trigger</div>
                <p style={{ fontSize: 13, color: "var(--faint)", marginBottom: 18, lineHeight: 1.5 }}>
                  Simulate a parametric trigger in a test city to generate sample claims.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                      Trigger
                    </label>
                    <select
                      className="select"
                      value={testTrigger}
                      onChange={(e) => setTestTrigger(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btnPrimary"
                    onClick={handleTestFire}
                    disabled={firing}
                    style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                  >
                    <IconFire />
                    {firing ? "Firing…" : "Fire Test Trigger"}
                  </button>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>
                    Active Alerts
                  </div>
                  {activeCities.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--faint)" }}>No active disruptions</div>
                  ) : (
                    activeCities.map((city) => (
                      <div
                        key={city}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: "#FEF2F2",
                          border: "1px solid #FECACA",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
                          {city}
                        </span>
                        <span style={{ fontSize: 11, color: "#B91C1C" }}>
                          {triggerStatus[city].triggers_fired.map((t) => t.trigger_id).join(", ")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "claims" && (
            <div className="card">
              <div className="sectionHead">
                <div className="sectionTitle">Auto-Generated Claims from Triggers</div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--faint)",
                    background: "var(--elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "2px 10px",
                  }}
                >
                  {claims.length} claims
                </span>
              </div>
              {claims.length === 0 ? (
                <div className="empty">No claims generated yet.</div>
              ) : (
                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Claim #</th>
                        <th>Worker ID</th>
                        <th>Platform</th>
                        <th>City</th>
                        <th>Trigger</th>
                        <th>Payout</th>
                        <th>Daily Wage</th>
                        <th>Fraud Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((c) => {
                        const fraud = Math.round(c.fraud_score * 100);
                        const fraudColor = fraud >= 75 ? "#DC2626" : fraud >= 40 ? "#D97706" : "#16A34A";
                        return (
                          <tr key={c.id}>
                            <td>
                              <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>
                                {c.claim_number}
                              </span>
                            </td>
                            <td>
                              <span className="mono" style={{ fontSize: 11, color: "var(--faint)" }}>
                                {c.worker_id?.slice(0, 12)}…
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: "var(--muted)" }}>{c.platform}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <IconMapPin />
                                <span style={{ fontWeight: 500 }}>{c.city}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: "var(--muted)" }}>
                              {TRIGGER_TYPE_LABELS[c.trigger_type] || c.trigger_type}
                            </td>
                            <td style={{ fontWeight: 700 }}>₹{c.payout_amount?.toLocaleString()}</td>
                            <td style={{ fontSize: 12, color: "var(--muted)" }}>
                              ₹{c.daily_wage_est?.toLocaleString()}
                            </td>
                            <td style={{ fontWeight: 700, color: fraudColor, fontSize: 12 }}>
                              {fraud}%
                            </td>
                            <td>
                              <StatusBadge status={c.payout_status || c.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
