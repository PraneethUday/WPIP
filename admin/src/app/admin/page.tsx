"use client";
import React, { useEffect, useState } from "react";

type Claim = {
  id: string;
  claim_number: string;
  worker_id: string;
  platform: string;
  city: string;
  trigger_id: string;
  trigger_type: string;
  payout_amount: number;
  daily_wage_est: number;
  disrupted_hours: number;
  payout_status: string;
  fraud_score: number;
  fraud_flags: string[];
  gps_verified: boolean;
  cross_platform_clear: boolean;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  paid_at: string | null;
  transaction_id: string | null;
  fuzzy_payout_multiplier: number;
};

type SupportTicket = {
  id: string;
  worker_id: string;
  worker_name: string | null;
  worker_email: string | null;
  delivery_id: string | null;
  ticket_type: "support" | "claim_escalation";
  subject: string;
  message: string;
  claim_id: string | null;
  claim_number: string | null;
  claim_trigger_type: string | null;
  source_tab: string | null;
  status: "open" | "in_progress" | "resolved";
  owner_notes: string | null;
  created_at: string;
  updated_at: string;
};

type Worker = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  platforms: string[];
  tier: string;
  verification_status: string;
  delivery_id: string;
  autopay: boolean;
  is_active: boolean;
  created_at: string;
  auto_verified: boolean;
  auto_verified_platforms: string[];
};

const PLATFORM_NAMES: Record<string, string> = {
  swiggy: "Swiggy",
  zomato: "Zomato",
  amazon: "Amazon Flex",
  blinkit: "Blinkit",
  zepto: "Zepto",
  meesho: "Meesho",
  porter: "Porter",
  dunzo: "Dunzo",
};

const TIER_OPTIONS = ["basic", "standard", "pro"] as const;

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  heavy_rain: "Heavy Rain",
  extreme_heat: "Extreme Heat",
  severe_aqi: "Severe AQI",
  flood: "Flood",
  traffic_congestion: "Traffic Congestion",
  curfew: "Curfew / Unrest",
};

export default function AdminPage() {
  const [tab, setTab] = useState<"workers" | "claims">("workers");

  // Workers state
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Claims state
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimStatusFilter, setClaimStatusFilter] = useState("all");
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState("");
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [approveAmounts, setApproveAmounts] = useState<Record<string, string>>(
    {},
  );
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [ticketNotice, setTicketNotice] = useState("");
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
    fetchClaims();
    fetchSupportTickets();
  }, []);

  const fetchClaims = () => {
    setClaimsLoading(true);
    fetch("/api/claims/all")
      .then((r) => r.json())
      .then((data) => {
        const list = data.claims || data.data || [];
        setClaims(list);
      })
      .catch(() => {})
      .finally(() => setClaimsLoading(false));
  };

  const fetchSupportTickets = () => {
    setTicketsLoading(true);
    fetch("/api/support/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
      })
      .catch(() => {})
      .finally(() => setTicketsLoading(false));
  };

  const updateSupportTicket = async (
    ticketId: string,
    status: "open" | "in_progress" | "resolved",
  ) => {
    setUpdatingTicketId(ticketId);
    setTicketNotice("");
    setError("");

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to update ticket.");
        return;
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t)),
      );
      setTicketNotice(`Ticket moved to ${status.replace("_", " ")}.`);
    } catch {
      setError("Failed to update ticket.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const updateClaim = async (
    claimId: string,
    status: string,
    approvedAmount?: number,
  ) => {
    setUpdatingClaimId(claimId);
    setClaimNotice("");
    try {
      const res = await fetch("/api/claims/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId,
          status,
          approved_amount: approvedAmount ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to update claim.");
        return;
      }
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, ...data.claim } : c)),
      );
      setClaimNotice(`Claim ${status === "paid" ? "marked as paid" : status}.`);
      setExpandedClaim(null);
      fetchClaims();
    } catch {
      setError("Failed to update claim.");
    } finally {
      setUpdatingClaimId(null);
    }
  };

  const handleEscalationAction = async (
    ticketId: string,
    claimId: string,
    action: "approved" | "rejected",
  ) => {
    setUpdatingTicketId(ticketId);
    setTicketNotice("");
    setError("");
    try {
      // 1. Update the claim status
      const claimRes = await fetch("/api/claims/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, status: action }),
      });
      const claimData = await claimRes.json();
      if (!claimRes.ok || claimData.error) {
        setError(claimData.error || "Failed to update claim.");
        return;
      }
      // 2. Auto-resolve the support ticket
      await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      setTicketNotice(
        `Claim ${action === "approved" ? "approved" : "rejected"} and ticket resolved.`,
      );
      fetchClaims();
      fetchSupportTickets();
    } catch {
      setError("Failed to process escalation.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const fetchWorkers = () => {
    setLoading(true);
    fetch("/api/admin/workers")
      .then((r) => r.json())
      .then((data) => {
        if (data.workers) setWorkers(data.workers);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Failed to fetch workers"))
      .finally(() => setLoading(false));
  };

  const filtered = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase()) ||
      w.city.toLowerCase().includes(search.toLowerCase()) ||
      w.delivery_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || w.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workers.length,
    verified: workers.filter((w) => w.verification_status === "verified")
      .length,
    pending: workers.filter((w) => w.verification_status === "pending").length,
    rejected: workers.filter((w) => w.verification_status === "rejected")
      .length,
    active: workers.filter((w) => w.is_active).length,
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticketStatusFilter === "all" || ticket.status === ticketStatusFilter,
  );

  const updateWorker = async (
    workerId: string,
    action?: "approve" | "reject" | "pending",
    tier?: string,
  ) => {
    setUpdatingId(workerId);
    try {
      const body: Record<string, string> = {};
      if (action) body.action = action;
      if (tier) body.tier = tier;

      const res = await fetch(`/api/admin/workers/${workerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update worker");
        setNotice("");
        return;
      }

      setWorkers((prev) =>
        prev.map((worker) => {
          if (worker.id !== workerId) return worker;
          return {
            ...worker,
            verification_status:
              data.worker.verification_status ?? worker.verification_status,
            tier: data.worker.tier ?? worker.tier,
            auto_verified: data.worker.auto_verified ?? worker.auto_verified,
            auto_verified_platforms:
              data.worker.auto_verified_platforms ??
              worker.auto_verified_platforms,
          };
        }),
      );
      setError("");
      if (action === "approve") setNotice("Worker approved successfully.");
      else if (action === "reject") setNotice("Worker rejected successfully.");
      else if (action === "pending") setNotice("Worker set back to pending.");
      else if (tier) setNotice(`Worker tier changed to ${tier}.`);
    } catch {
      setError("Failed to update worker");
      setNotice("");
    } finally {
      setUpdatingId(null);
    }
  };

  const refreshDashboard = () => {
    fetchWorkers();
    fetchClaims();
    fetchSupportTickets();
  };

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">
            Manage registered delivery partners, claim lifecycles, and support
            escalations from one operational console.
          </p>
        </div>
        <button
          type="button"
          className="admin-page-action"
          onClick={refreshDashboard}
        >
          Refresh Data
        </button>
      </div>

      {/* Tab nav */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          background: "var(--card)",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          border: "1px solid var(--border)",
        }}
      >
        {(["workers", "claims"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "7px 20px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background: tab === t ? "var(--primary)" : "transparent",
              color: tab === t ? "#fff" : "var(--faint)",
              boxShadow: tab === t ? "0 2px 8px rgba(108,99,255,0.4)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t === "workers"
              ? "Workers"
              : `Claims${claims.length ? ` (${claims.filter((c) => c.status === "pending" || c.status === "under_review").length})` : ""}`}
          </button>
        ))}
      </div>

      {(notice || claimNotice || ticketNotice) && (
        <div
          style={{
            marginBottom: 12,
            background: "#0A2E18",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#22C55E",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          {notice || claimNotice || ticketNotice}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 12,
            background: "#2E0A0A",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#EF4444",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          {error}
        </div>
      )}

      {tab === "workers" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
              marginBottom: 28,
            }}
          >
            <StatCard
              label="Total Workers"
              value={stats.total}
              color="#0f172a"
            />
            <StatCard label="Verified" value={stats.verified} color="#16a34a" />
            <StatCard label="Pending" value={stats.pending} color="#d97706" />
            <StatCard label="Rejected" value={stats.rejected} color="#dc2626" />
            <StatCard label="Active" value={stats.active} color="#4f46e5" />
          </div>

          <div
            style={{
              background: "var(--card)",
              borderRadius: 12,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: 0,
                  color: "var(--white)",
                }}
              >
                Registered Workers
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    fontSize: 13,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    outline: "none",
                    cursor: "pointer",
                    background: "var(--input)",
                    color: "var(--white)",
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input
                  placeholder="Search name, email, city, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: 280,
                    height: 36,
                    padding: "0 12px",
                    fontSize: 13,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    outline: "none",
                    background: "var(--input)",
                    color: "var(--white)",
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--faint)",
                }}
              >
                Loading workers...
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--faint)",
                }}
              >
                {workers.length === 0
                  ? "No workers registered yet."
                  : "No workers match your filters."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: "var(--elevated)" }}>
                      {[
                        "Name",
                        "Email",
                        "City",
                        "Delivery ID",
                        "Platforms",
                        "Tier",
                        "Auto Check",
                        "Status",
                        "Actions",
                        "Registered",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontWeight: 700,
                            color: "var(--faint)",
                            borderBottom: "1px solid var(--border)",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((w) => (
                      <tr
                        key={w.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 14px",
                            fontWeight: 600,
                            color: "var(--white)",
                          }}
                        >
                          {w.name}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "var(--faint)",
                            fontSize: 12,
                          }}
                        >
                          {w.email}
                        </td>
                        <td style={{ padding: "12px 14px", color: "var(--muted)" }}>
                          {w.city}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "var(--faint)",
                            fontSize: 11,
                            fontFamily: "monospace",
                          }}
                        >
                          {w.delivery_id?.slice(0, 12)}...
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {w.platforms.map((p) => (
                              <span
                                key={p}
                                style={{
                                  background: "var(--primary-container)",
                                  color: "var(--primary-dim)",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              >
                                {PLATFORM_NAMES[p] || p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <select
                            value={w.tier}
                            onChange={(e) =>
                              updateWorker(w.id, undefined, e.target.value)
                            }
                            disabled={updatingId === w.id}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px solid var(--border)",
                              cursor: "pointer",
                              background: "var(--input)",
                              color:
                                w.tier === "pro"
                                  ? "#c084fc"
                                  : w.tier === "standard"
                                    ? "var(--primary)"
                                    : "#22C55E",
                            }}
                          >
                            {TIER_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              background: w.auto_verified
                                ? "#f0fdf4"
                                : "#fef2f2",
                              color: w.auto_verified ? "#16a34a" : "#dc2626",
                            }}
                            title={
                              w.auto_verified_platforms?.length
                                ? `Matched: ${w.auto_verified_platforms.join(", ")}`
                                : "No platform match"
                            }
                          >
                            {w.auto_verified ? "Matched" : "Not matched"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              background:
                                w.verification_status === "verified"
                                  ? "#f0fdf4"
                                  : w.verification_status === "rejected"
                                    ? "#fef2f2"
                                    : "#fffbeb",
                              color:
                                w.verification_status === "verified"
                                  ? "#16a34a"
                                  : w.verification_status === "rejected"
                                    ? "#dc2626"
                                    : "#d97706",
                            }}
                          >
                            {w.verification_status.charAt(0).toUpperCase() +
                              w.verification_status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {w.verification_status !== "verified" && (
                              <ActionBtn
                                label="Approve"
                                bg="#f0fdf4"
                                border="#86efac"
                                color="#166534"
                                disabled={updatingId === w.id}
                                onClick={() => updateWorker(w.id, "approve")}
                              />
                            )}
                            {w.verification_status !== "rejected" && (
                              <ActionBtn
                                label="Reject"
                                bg="#fef2f2"
                                border="#fecaca"
                                color="#b91c1c"
                                disabled={updatingId === w.id}
                                onClick={() => updateWorker(w.id, "reject")}
                              />
                            )}
                            {w.verification_status !== "pending" && (
                              <ActionBtn
                                label="Pending"
                                bg="#fffbeb"
                                border="#fde68a"
                                color="#92400e"
                                disabled={updatingId === w.id}
                                onClick={() => updateWorker(w.id, "pending")}
                              />
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "var(--faint)",
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(w.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "claims" && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: 0,
                color: "var(--white)",
              }}
            >
              Insurance Claims
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={claimStatusFilter}
                onChange={(e) => setClaimStatusFilter(e.target.value)}
                style={{
                  height: 36,
                  padding: "0 12px",
                  fontSize: 13,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  outline: "none",
                  cursor: "pointer",
                  background: "var(--input)",
                  color: "var(--white)",
                }}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  fetchClaims();
                  fetchSupportTickets();
                }}
                style={{
                  height: 36,
                  padding: "0 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "var(--card)",
                  color: "var(--faint)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          {claimsLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--faint)" }}>
              Loading claims...
            </div>
          ) : (
            <div
              style={{
                background: "var(--card)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              {claims.filter(
                (c) =>
                  claimStatusFilter === "all" || c.status === claimStatusFilter || c.payout_status === claimStatusFilter,
              ).length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--faint)",
                  }}
                >
                  No claims found.
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: "var(--elevated)" }}>
                      {[
                        "Claim #",
                        "Worker / City",
                        "Trigger",
                        "Payout",
                        "Fraud Score",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontWeight: 700,
                            color: "var(--faint)",
                            borderBottom: "1px solid var(--border)",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {claims
                      .filter(
                        (c) =>
                          claimStatusFilter === "all" ||
                          c.status === claimStatusFilter ||
                          c.payout_status === claimStatusFilter,
                      )
                      .map((c) => (
                        <React.Fragment key={c.id}>
                          <tr
                            key={c.id}
                            style={{
                              borderBottom:
                                expandedClaim === c.id
                                  ? "none"
                                  : "1px solid var(--border)",
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 14px",
                                fontWeight: 600,
                                color: "var(--white)",
                                fontSize: 12,
                                fontFamily: "monospace",
                              }}
                            >
                              {c.claim_number}
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                              }}
                            >
                              <div style={{ fontWeight: 600, color: "var(--white)", marginBottom: 2, fontSize: 12, fontFamily: "monospace" }}>
                                {c.worker_id?.slice(0, 12)}...
                              </div>
                              <div style={{ fontSize: 11, color: "var(--faint)" }}>
                                {c.city} · {c.platform}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                color: "var(--muted)",
                              }}
                            >
                              {TRIGGER_TYPE_LABELS[c.trigger_type] || c.trigger_type}
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                fontWeight: 600,
                                color: "var(--white)",
                              }}
                            >
                              ₹{c.payout_amount}
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                color: c.fraud_score >= 0.75 ? "#EF4444" : "#22C55E",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {(c.fraud_score * 100).toFixed(0)}%
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <ClaimBadge status={c.payout_status || c.status} />
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 4,
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedClaim(
                                      expandedClaim === c.id ? null : c.id,
                                    )
                                  }
                                  style={{
                                    border: "1px solid #d1d5db",
                                    background: "#f8fafc",
                                    color: "#374151",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  {expandedClaim === c.id ? "Close" : "Review"}
                                </button>
                                {c.payout_status === "approved" && (
                                  <ActionBtn
                                    label="Mark Paid"
                                    bg="#f5f3ff"
                                    border="#ddd6fe"
                                    color="#7c3aed"
                                    disabled={updatingClaimId === c.id}
                                    onClick={() => updateClaim(c.id, "paid")}
                                  />
                                )}
                                {(c.payout_status === "pending" || c.status === "under_review") && (
                                  <>
                                    <ActionBtn
                                      label="Approve"
                                      bg="#f0fdf4"
                                      border="#86efac"
                                      color="#166534"
                                      disabled={updatingClaimId === c.id}
                                      onClick={() => updateClaim(c.id, "approved")}
                                    />
                                    <ActionBtn
                                      label="Reject"
                                      bg="#fef2f2"
                                      border="#fecaca"
                                      color="#b91c1c"
                                      disabled={updatingClaimId === c.id}
                                      onClick={() => updateClaim(c.id, "rejected")}
                                    />
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedClaim === c.id && (
                            <tr
                              key={`${c.id}-expand`}
                              style={{
                                borderBottom: "1px solid var(--border)",
                              }}
                            >
                              <td
                                colSpan={7}
                                style={{
                                  padding: "0 14px 16px",
                                  background: "var(--elevated)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 16,
                                    paddingTop: 12,
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "var(--faint)",
                                        textTransform: "uppercase",
                                        marginBottom: 6,
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      Fraud Flags
                                    </div>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                                      {(c.fraud_flags || []).map((flag: string) => (
                                        <span
                                          key={flag}
                                          style={{
                                            background: "#2A1A0A",
                                            color: "#F59E0B",
                                            padding: "2px 8px",
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            border: "1px solid rgba(245,158,11,0.3)",
                                          }}
                                        >
                                          {flag.replace(/_/g, " ")}
                                        </span>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 4 }}>
                                      Daily wage est: <strong style={{ color: "var(--white)" }}>₹{c.daily_wage_est}</strong>
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 4 }}>
                                      Disrupted hours: <strong style={{ color: "var(--white)" }}>{c.disrupted_hours}h</strong>
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 4 }}>
                                      GPS verified: <strong style={{ color: c.gps_verified ? "#22C55E" : "#EF4444" }}>{c.gps_verified ? "Yes" : "No"}</strong>
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--faint)" }}>
                                      Cross-platform clear: <strong style={{ color: c.cross_platform_clear ? "#22C55E" : "#EF4444" }}>{c.cross_platform_clear ? "Yes" : "No"}</strong>
                                    </div>
                                    {c.transaction_id && (
                                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--faint)", marginTop: 8 }}>
                                        TXN: {c.transaction_id}
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 10,
                                    }}
                                  >
                                    <div>
                                      <label
                                        style={{
                                          display: "block",
                                          fontSize: 11,
                                          fontWeight: 600,
                                          color: "var(--faint)",
                                          marginBottom: 4,
                                        }}
                                      >
                                        Adjust payout amount (₹)
                                      </label>
                                      <input
                                        type="number"
                                        placeholder={`Current ₹${c.payout_amount}`}
                                        value={approveAmounts[c.id] ?? ""}
                                        onChange={(e) =>
                                          setApproveAmounts((prev) => ({
                                            ...prev,
                                            [c.id]: e.target.value,
                                          }))
                                        }
                                        style={{
                                          width: "100%",
                                          height: 36,
                                          padding: "0 10px",
                                          fontSize: 13,
                                          border:
                                            "1px solid var(--border)",
                                          borderRadius: 8,
                                          outline: "none",
                                          boxSizing: "border-box",
                                          background: "var(--input)",
                                          color: "var(--white)",
                                        }}
                                      />
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <ActionBtn
                                        label="Approve"
                                        bg="#f0fdf4"
                                        border="#86efac"
                                        color="#166534"
                                        disabled={updatingClaimId === c.id}
                                        onClick={() =>
                                          updateClaim(
                                            c.id,
                                            "approved",
                                            approveAmounts[c.id]
                                              ? parseFloat(approveAmounts[c.id])
                                              : c.payout_amount,
                                          )
                                        }
                                      />
                                      <ActionBtn
                                        label="Reject"
                                        bg="#fef2f2"
                                        border="#fecaca"
                                        color="#b91c1c"
                                        disabled={updatingClaimId === c.id}
                                        onClick={() =>
                                          updateClaim(
                                            c.id,
                                            "rejected",
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: 0,
                  color: "var(--white)",
                }}
              >
                Support & Escalation Tickets
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    fontSize: 13,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    outline: "none",
                    cursor: "pointer",
                    background: "var(--input)",
                    color: "var(--white)",
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button
                  type="button"
                  onClick={fetchSupportTickets}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "var(--card)",
                    color: "var(--faint)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>

            {ticketsLoading ? (
              <div
                style={{
                  padding: 28,
                  textAlign: "center",
                  color: "var(--faint)",
                }}
              >
                Loading support tickets...
              </div>
            ) : (
              <div
                style={{
                  background: "var(--card)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                {filteredTickets.length === 0 ? (
                  <div
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: "var(--faint)",
                    }}
                  >
                    No support tickets found.
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "var(--elevated)" }}>
                        {[
                          "Worker",
                          "Type",
                          "Issue",
                          "Claim",
                          "Status",
                          "Created",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 14px",
                              textAlign: "left",
                              fontWeight: 700,
                              color: "var(--faint)",
                              borderBottom: "1px solid var(--border)",
                              fontSize: 11,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          style={{
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <td style={{ padding: "12px 14px" }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--white)",
                                marginBottom: 2,
                              }}
                            >
                              {ticket.worker_name ||
                                ticket.delivery_id ||
                                "Unknown"}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--faint)" }}>
                              {ticket.worker_email || ticket.worker_id}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background:
                                  ticket.ticket_type === "claim_escalation"
                                    ? "#2A1A0A"
                                    : "#0a1a3a",
                                color:
                                  ticket.ticket_type === "claim_escalation"
                                    ? "#F59E0B"
                                    : "#60A5FA",
                                border:
                                  ticket.ticket_type === "claim_escalation"
                                    ? "1px solid rgba(245,158,11,0.3)"
                                    : "1px solid rgba(96,165,250,0.3)",
                              }}
                            >
                              {ticket.ticket_type === "claim_escalation"
                                ? "Escalation"
                                : "Support"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", maxWidth: 320 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--white)",
                                marginBottom: 2,
                              }}
                            >
                              {ticket.subject}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--faint)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={ticket.message}
                            >
                              {ticket.message}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "var(--muted)",
                            }}
                          >
                            {ticket.claim_number || "—"}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <SupportTicketBadge status={ticket.status} />
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "var(--faint)",
                              fontSize: 12,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(ticket.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                flexWrap: "wrap",
                              }}
                            >
                              {ticket.status === "open" && (
                                <ActionBtn
                                  label="In Progress"
                                  bg="#eff6ff"
                                  border="#bfdbfe"
                                  color="#2563eb"
                                  disabled={updatingTicketId === ticket.id}
                                  onClick={() =>
                                    updateSupportTicket(
                                      ticket.id,
                                      "in_progress",
                                    )
                                  }
                                />
                              )}
                              {/* Claim escalation: show Approve / Reject that also update the claim */}
                              {ticket.ticket_type === "claim_escalation" &&
                                ticket.claim_id &&
                                ticket.status !== "resolved" && (
                                  <>
                                    <ActionBtn
                                      label="Approve Claim"
                                      bg="#f0fdf4"
                                      border="#86efac"
                                      color="#166534"
                                      disabled={updatingTicketId === ticket.id}
                                      onClick={() =>
                                        handleEscalationAction(
                                          ticket.id,
                                          ticket.claim_id!,
                                          "approved",
                                        )
                                      }
                                    />
                                    <ActionBtn
                                      label="Reject Claim"
                                      bg="#fef2f2"
                                      border="#fecaca"
                                      color="#b91c1c"
                                      disabled={updatingTicketId === ticket.id}
                                      onClick={() =>
                                        handleEscalationAction(
                                          ticket.id,
                                          ticket.claim_id!,
                                          "rejected",
                                        )
                                      }
                                    />
                                  </>
                                )}
                              {ticket.ticket_type !== "claim_escalation" &&
                                ticket.status !== "resolved" && (
                                <ActionBtn
                                  label="Resolve"
                                  bg="#f0fdf4"
                                  border="#86efac"
                                  color="#166534"
                                  disabled={updatingTicketId === ticket.id}
                                  onClick={() =>
                                    updateSupportTicket(ticket.id, "resolved")
                                  }
                                />
                              )}
                              {ticket.status === "resolved" && (
                                <ActionBtn
                                  label="Reopen"
                                  bg="#fffbeb"
                                  border="#fde68a"
                                  color="#92400e"
                                  disabled={updatingTicketId === ticket.id}
                                  onClick={() =>
                                    updateSupportTicket(ticket.id, "open")
                                  }
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ClaimBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    pending: {
      background: "#2A1A0A",
      color: "#FF8C42",
      border: "1px solid rgba(255,140,66,0.3)",
    },
    under_review: {
      background: "#0a1a3a",
      color: "#3B82F6",
      border: "1px solid rgba(59,130,246,0.3)",
    },
    approved: {
      background: "#0A2E18",
      color: "#22C55E",
      border: "1px solid rgba(34,197,94,0.3)",
    },
    rejected: {
      background: "#2E0A0A",
      color: "#EF4444",
      border: "1px solid rgba(239,68,68,0.3)",
    },
    paid: {
      background: "var(--primary-container)",
      color: "var(--primary)",
      border: "1px solid rgba(108,99,255,0.3)",
    },
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      style={{
        ...s,
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {labels[status] || status}
    </span>
  );
}

function SupportTicketBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    open: {
      background: "#2A1A0A",
      color: "#F59E0B",
      border: "1px solid rgba(245,158,11,0.3)",
    },
    in_progress: {
      background: "#0a1a3a",
      color: "#60A5FA",
      border: "1px solid rgba(96,165,250,0.3)",
    },
    resolved: {
      background: "#0A2E18",
      color: "#22C55E",
      border: "1px solid rgba(34,197,94,0.3)",
    },
  };
  const labels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
  };
  const s = styles[status] || styles.open;
  return (
    <span
      style={{
        ...s,
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {labels[status] || status}
    </span>
  );
}

function ActionBtn({
  label,
  bg,
  border,
  color,
  disabled,
  onClick,
}: {
  label: string;
  bg: string;
  border: string;
  color: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        border: `1px solid ${border}`,
        background: bg,
        color,
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          fontWeight: 500,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
