"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

const IconArrow = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/backend/admin/data-summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setError("Could not load analytics data — is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const maxEarnings = summary
    ? Math.max(...summary.platforms.map((p) => p.avg_earnings))
    : 0;

  return (
    <div>
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">Analytics</h1>
          <p className="pageSubtitle">
            Platform earnings distribution and worker activity metrics.
          </p>
        </div>
        <Link href="/control-center" className="btn btnPrimary" style={{ textDecoration: "none" }}>
          Advanced Controls <IconArrow />
        </Link>
      </div>

      {error && <div className="alertError">{error}</div>}

      {loading ? (
        <div className="loading">Loading analytics…</div>
      ) : summary ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary stats */}
          <div className="gridStats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="statCard">
              <div className="statLabel">Data As Of</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--white)" }}>{summary.date}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Total Workers (Today)</div>
              <div className="statValue">{summary.total_workers?.toLocaleString()}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Overall Avg. Daily Earnings</div>
              <div className="statValue">₹{summary.overall_avg_earnings?.toFixed(0)}</div>
            </div>
          </div>

          {/* Platform Earnings Chart */}
          <div className="card cardPad">
            <div className="sectionTitle" style={{ marginBottom: 20 }}>
              Average Earnings by Platform
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[...summary.platforms]
                .sort((a, b) => b.avg_earnings - a.avg_earnings)
                .map((p) => {
                  const pct = maxEarnings ? (p.avg_earnings / maxEarnings) * 100 : 0;
                  const name = p.platform.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={p.platform}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ color: "var(--white)" }}>{name}</span>
                        <span style={{ color: "var(--faint)" }}>
                          ₹{p.avg_earnings?.toFixed(0)}/day ·{" "}
                          {p.worker_count?.toLocaleString()} workers
                        </span>
                      </div>
                      <div className="progressBar">
                        <div
                          className="progressFill"
                          style={{ width: `${pct}%`, background: "#2563EB" }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Platform table */}
          <div className="card">
            <div className="sectionHead">
              <div className="sectionTitle">Platform Breakdown</div>
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
                  {summary.platforms.map((p) => (
                    <tr key={p.platform}>
                      <td style={{ fontWeight: 600 }}>
                        {p.platform.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </td>
                      <td style={{ color: "var(--muted)" }}>{p.worker_count?.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>₹{p.avg_earnings?.toFixed(0)}</td>
                      <td style={{ color: "var(--faint)" }}>₹{p.min_earnings?.toFixed(0)}</td>
                      <td style={{ color: "var(--faint)" }}>₹{p.max_earnings?.toFixed(0)}</td>
                      <td style={{ color: "var(--muted)" }}>{p.avg_deliveries?.toFixed(1)}</td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{p.total_earnings?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
