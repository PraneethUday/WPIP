"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Worker = {
  id: string;
  name: string;
  email: string;
  city: string;
  platforms: string[];
  tier: string;
  verification_status: string;
  delivery_id: string;
  is_active: boolean;
  created_at: string;
};

type Claim = {
  id: string;
  claim_number: string;
  worker_id: string;
  city: string;
  trigger_type: string;
  payout_amount: number;
  status: string;
  payout_status: string;
  fraud_score: number;
  created_at: string;
};

type SupportTicket = {
  id: string;
  worker_name: string | null;
  subject: string;
  ticket_type: string;
  status: string;
  created_at: string;
};

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  heavy_rain: "Heavy Rain",
  extreme_heat: "Extreme Heat",
  severe_aqi: "Severe AQI",
  flood: "Flood",
  traffic_congestion: "Traffic",
  curfew: "Curfew",
};

const AVATAR_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#DCFCE7", text: "#15803D" },
  { bg: "#EDE9FE", text: "#6D28D9" },
  { bg: "#FFEDD5", text: "#C2410C" },
  { bg: "#FEF3C7", text: "#92400E" },
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function claimStatusLabel(c: Claim) {
  return c.payout_status || c.status;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="statCard">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div className="statLabel">{label}</div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
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
      </div>
      <div className="statValue">{value}</div>
      {sub && <div className="statSub">{sub}</div>}
    </div>
  );
}

const IconUsers = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M1.5 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.5 13.5c0-2.071-1.343-3.845-3.228-4.363" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconPulse = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
    <path d="M1 8h3l2-5 3 10 2-5 1 0h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <path d="M12.25 7A5.25 5.25 0 1 1 7 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 1.75L9.5 4.25 7 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrow = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


function tierBadge(tier: string) {
  if (tier === "pro")
    return <span className="badge badgePurple">PREMIUM</span>;
  if (tier === "standard")
    return <span className="badge badgeGray">STANDARD</span>;
  return <span className="badge badgeGreen">BASIC</span>;
}

function claimStatusBadge(status: string) {
  const s = status?.toLowerCase();
  if (s === "approved") return <span className="badge badgeGreen">Approved</span>;
  if (s === "paid") return <span className="badge badgeGreen">Paid</span>;
  if (s === "rejected") return <span className="badge badgeRed">Rejected</span>;
  if (s === "under_review") return <span className="badge badgeBlue">Under Review</span>;
  if (s === "pending") return <span className="badge badgeAmber">Pending</span>;
  return <span className="badge badgeGray">{status}</span>;
}

export default function OverviewPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/workers").then((r) => r.json()),
      fetch("/api/claims/all").then((r) => r.json()),
      fetch("/api/support/tickets").then((r) => r.json()),
    ]).then(([wData, cData, tData]) => {
      if (wData.workers) setWorkers(wData.workers);
      const claimList = cData.claims || cData.data || [];
      setClaims(claimList);
      if (tData.tickets) setTickets(tData.tickets);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: workers.length,
    verified: workers.filter((w) => w.verification_status === "verified").length,
    pending: workers.filter((w) => w.verification_status === "pending").length,
    rejected: workers.filter((w) => w.verification_status === "rejected").length,
    active: workers.filter((w) => w.is_active).length,
  };

  const claimDist = {
    under_review: claims.filter((c) => c.status === "under_review").length,
    pending: claims.filter((c) => c.payout_status === "pending" || c.status === "pending").length,
    approved: claims.filter((c) => c.payout_status === "approved" || c.status === "approved").length,
    rejected: claims.filter((c) => c.status === "rejected" || c.payout_status === "rejected").length,
    total: claims.length,
  };

  const urgentClaims = claims
    .filter((c) => c.status === "under_review" || c.payout_status === "pending")
    .slice(0, 5);

  const recentWorkers = workers.slice(0, 10);
  const openTickets = tickets.filter((t) => t.status === "open").length;

  function pct(n: number) {
    if (!claimDist.total) return 0;
    return Math.round((n / claimDist.total) * 100);
  }

  return (
    <div>
      {/* Page header */}
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">System Overview</h1>
          <p className="pageSubtitle">
            Real-time status of worker registrations and claim processing.
          </p>
        </div>
        <div className="pageActions">
          <button
            type="button"
            className="btn btnSecondary"
            onClick={() => window.location.reload()}
          >
            <IconRefresh /> Refresh
          </button>
          <Link href="/reports" className="btn btnPrimary" style={{ textDecoration: "none" }}>
            + New Report
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div
        className="gridStats"
        style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 24 }}
      >
        <StatCard
          label="Total Workers"
          value={loading ? "—" : stats.total.toLocaleString()}
          sub={loading ? "" : `${stats.active} currently active`}
          icon={<IconUsers />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
        <StatCard
          label="Verified"
          value={loading ? "—" : stats.verified.toLocaleString()}
          sub={
            loading
              ? ""
              : stats.total
              ? `${Math.round((stats.verified / stats.total) * 100)}% of total`
              : "0% of total"
          }
          icon={<IconCheck />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <StatCard
          label="Pending"
          value={loading ? "—" : stats.pending.toLocaleString()}
          sub="Action required"
          icon={<IconClock />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          label="Rejected"
          value={loading ? "—" : stats.rejected.toLocaleString()}
          sub="Past 30 days"
          icon={<IconX />}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
        />
        <StatCard
          label="Active Now"
          value={loading ? "—" : stats.active.toLocaleString()}
          sub="Current platform load"
          icon={<IconPulse />}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
      </div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left: Registered Workers */}
        <div className="card">
          <div className="sectionHead">
            <div>
              <div className="sectionTitle">Registered Workers</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--faint)",
                  background: "var(--elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "4px 10px",
                }}
              >
                Show: All Workers ▾
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading workers…</div>
          ) : (
            <>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name / Email</th>
                      <th>Location</th>
                      <th>ID / Platform</th>
                      <th>Tier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWorkers.map((w) => {
                      const color = getAvatarColor(w.name);
                      return (
                        <tr key={w.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                className="avatar"
                                style={{ background: color.bg, color: color.text }}
                              >
                                {getInitials(w.name)}
                              </div>
                              <div>
                                <div
                                  style={{ fontWeight: 600, fontSize: 13, color: "var(--white)" }}
                                >
                                  {w.name}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--faint)" }}>
                                  {w.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: "var(--muted)", fontSize: 13 }}>{w.city}</td>
                          <td>
                            <div
                              className="mono"
                              style={{ fontWeight: 700, fontSize: 12, color: "var(--white)" }}
                            >
                              #{w.delivery_id?.slice(0, 8)}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 2 }}>
                              {w.platforms?.[0]?.toUpperCase()}
                            </div>
                          </td>
                          <td>{tierBadge(w.tier)}</td>
                          <td>
                            {w.verification_status === "verified" ? (
                              <span className="badge badgeGreen">Verified</span>
                            ) : w.verification_status === "rejected" ? (
                              <span className="badge badgeRed">Rejected</span>
                            ) : (
                              <span className="badge badgeAmber">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="paginationRow">
                <span>
                  Showing 1–{recentWorkers.length} of {stats.total.toLocaleString()} workers
                </span>
                <Link
                  href="/workers"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "var(--info)",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View all <IconArrow />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Claims Distribution */}
          <div className="card cardPad">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <div className="sectionTitle">Claims Distribution</div>
              <Link
                href="/claims"
                style={{ fontSize: 12, color: "var(--info)", textDecoration: "none", fontWeight: 600 }}
              >
                View all
              </Link>
            </div>

            {[
              { label: "Under Review", count: claimDist.under_review, color: "#2563EB" },
              { label: "Awaiting Docs", count: claimDist.pending, color: "#D97706" },
              { label: "Final Processing", count: claimDist.approved, color: "#16A34A" },
              { label: "Disputed", count: claimDist.rejected, color: "#DC2626" },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                    fontSize: 13,
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontWeight: 600, color: "var(--white)" }}>
                    {pct(count)}%
                  </span>
                </div>
                <div className="progressBar">
                  <div
                    className="progressFill"
                    style={{ width: `${pct(count)}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Urgent Claims */}
          <div className="card">
            <div className="sectionHead" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="sectionTitle">Urgent Claims</div>
              {urgentClaims.length > 0 && (
                <span
                  className="badge badgeRed"
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {urgentClaims.length} ACTION REQUIRED
                </span>
              )}
            </div>

            {loading ? (
              <div className="loading" style={{ padding: 24 }}>Loading…</div>
            ) : urgentClaims.length === 0 ? (
              <div className="empty" style={{ padding: 24 }}>No urgent claims</div>
            ) : (
              <div>
                {urgentClaims.map((c, idx) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "14px 20px",
                      borderBottom:
                        idx < urgentClaims.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontWeight: 700, fontSize: 13, color: "var(--white)" }}
                      >
                        {c.claim_number}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--white)" }}>
                        ₹{c.payout_amount?.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 6 }}>
                      {TRIGGER_TYPE_LABELS[c.trigger_type] || c.trigger_type} ·{" "}
                      {c.city}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {claimStatusBadge(claimStatusLabel(c))}
                    </div>
                  </div>
                ))}
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
                  <Link
                    href="/claims"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "var(--info)",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    View all claims <IconArrow />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card cardPad">
            <div className="sectionTitle" style={{ marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href="/workers"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--elevated)",
                  textDecoration: "none",
                  color: "var(--white)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                }}
              >
                <span>Pending Workers ({stats.pending})</span>
                <IconArrow />
              </Link>
              <Link
                href="/support"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--elevated)",
                  textDecoration: "none",
                  color: "var(--white)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                }}
              >
                <span>Open Support Tickets ({openTickets})</span>
                <IconArrow />
              </Link>
              <Link
                href="/disruptions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--elevated)",
                  textDecoration: "none",
                  color: "var(--white)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                }}
              >
                <span>Disruption Monitor</span>
                <IconArrow />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
