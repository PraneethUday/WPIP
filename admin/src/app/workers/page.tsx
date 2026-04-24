"use client";
import React, { useEffect, useState } from "react";

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

const AVATAR_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#DCFCE7", text: "#15803D" },
  { bg: "#EDE9FE", text: "#6D28D9" },
  { bg: "#FFEDD5", text: "#C2410C" },
  { bg: "#FEF3C7", text: "#92400E" },
];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") return <span className="badge badgeGreen">Verified</span>;
  if (status === "rejected") return <span className="badge badgeRed">Rejected</span>;
  return <span className="badge badgeAmber">Pending</span>;
}

const IconSearch = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <circle cx="6" cy="6" r="4.5" stroke="#94A3B8" strokeWidth="1.3" />
    <path d="M10 10l2.5 2.5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <path d="M12.25 7A5.25 5.25 0 1 1 7 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 1.75L9.5 4.25 7 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <path d="M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = () => {
    setLoading(true);
    fetch("/api/admin/workers")
      .then((r) => r.json())
      .then((data) => {
        if (data.workers) setWorkers(data.workers);
        else setError(data.error || "Failed to load workers");
      })
      .catch(() => setError("Failed to fetch workers"))
      .finally(() => setLoading(false));
  };

  const updateWorker = async (
    workerId: string,
    action?: "approve" | "reject" | "pending",
    tier?: string,
  ) => {
    setUpdatingId(workerId);
    setNotice("");
    setError("");
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
      if (!res.ok) { setError(data.error || "Failed to update worker"); return; }
      setWorkers((prev) =>
        prev.map((w) =>
          w.id !== workerId ? w : {
            ...w,
            verification_status: data.worker.verification_status ?? w.verification_status,
            tier: data.worker.tier ?? w.tier,
            auto_verified: data.worker.auto_verified ?? w.auto_verified,
            auto_verified_platforms: data.worker.auto_verified_platforms ?? w.auto_verified_platforms,
          }
        )
      );
      if (action === "approve") setNotice("Worker approved successfully.");
      else if (action === "reject") setNotice("Worker rejected.");
      else if (action === "pending") setNotice("Worker set back to pending.");
      else if (tier) setNotice(`Tier changed to ${tier}.`);
    } catch {
      setError("Failed to update worker");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = workers.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch =
      w.name.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q) ||
      w.city.toLowerCase().includes(q) ||
      w.delivery_id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || w.verification_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: workers.length,
    verified: workers.filter((w) => w.verification_status === "verified").length,
    pending: workers.filter((w) => w.verification_status === "pending").length,
    rejected: workers.filter((w) => w.verification_status === "rejected").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">Workers</h1>
          <p className="pageSubtitle">
            Manage registered delivery partners, verification status, and tier assignments.
          </p>
        </div>
        <div className="pageActions">
          <button type="button" className="btn btnSecondary" onClick={fetchWorkers}>
            <IconRefresh /> Refresh
          </button>
          <button type="button" className="btn btnPrimary">
            <IconDownload /> Export
          </button>
        </div>
      </div>

      {/* Summary */}
      <div
        className="gridStats"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}
      >
        {[
          { label: "Total", value: stats.total, cls: "" },
          { label: "Verified", value: stats.verified, cls: "badgeGreen" },
          { label: "Pending", value: stats.pending, cls: "badgeAmber" },
          { label: "Rejected", value: stats.rejected, cls: "badgeRed" },
        ].map(({ label, value }) => (
          <div key={label} className="statCard">
            <div className="statLabel">{label} Workers</div>
            <div className="statValue">{loading ? "—" : value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {notice && <div className="alertSuccess">{notice}</div>}
      {error && <div className="alertError">{error}</div>}

      {/* Table card */}
      <div className="card">
        <div className="sectionHead">
          <div className="sectionTitle">
            Registered Workers
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--faint)",
                background: "var(--elevated)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "2px 10px",
              }}
            >
              {filtered.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0 12px",
                height: 36,
              }}
            >
              <IconSearch />
              <input
                placeholder="Search name, email, city, or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 13,
                  color: "var(--white)",
                  width: 240,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading workers…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            {workers.length === 0 ? "No workers registered yet." : "No workers match your filters."}
          </div>
        ) : (
          <>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Location</th>
                    <th>Delivery ID</th>
                    <th>Platforms</th>
                    <th>Tier</th>
                    <th>Auto Check</th>
                    <th>Status</th>
                    <th>Autopay</th>
                    <th>Actions</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => {
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
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
                              <div style={{ fontSize: 12, color: "var(--faint)" }}>{w.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)" }}>
                          <div>{w.city}</div>
                          {w.area && <div style={{ fontSize: 11, color: "var(--faint)" }}>{w.area}</div>}
                        </td>
                        <td>
                          <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>
                            {w.delivery_id?.slice(0, 14)}…
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {w.platforms.map((p) => (
                              <span
                                key={p}
                                style={{
                                  background: "#EFF6FF",
                                  color: "#2563EB",
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {PLATFORM_NAMES[p] || p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <select
                            className="select"
                            value={w.tier}
                            onChange={(e) => updateWorker(w.id, undefined, e.target.value)}
                            disabled={updatingId === w.id}
                            style={{ height: 30, fontSize: 12, padding: "0 28px 0 8px" }}
                          >
                            {TIER_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${w.auto_verified ? "badgeGreen" : "badgeRed"}`}>
                            {w.auto_verified ? "Matched" : "No match"}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={w.verification_status} />
                        </td>
                        <td>
                          <span className={`badge ${w.autopay ? "badgeGreen" : "badgeGray"}`}>
                            {w.autopay ? "On" : "Off"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {w.verification_status !== "verified" && (
                              <button
                                type="button"
                                className="btn btnSm"
                                disabled={updatingId === w.id}
                                onClick={() => updateWorker(w.id, "approve")}
                                style={{
                                  background: "#F0FDF4",
                                  color: "#166534",
                                  border: "1px solid #86EFAC",
                                }}
                              >
                                Approve
                              </button>
                            )}
                            {w.verification_status !== "rejected" && (
                              <button
                                type="button"
                                className="btn btnSm"
                                disabled={updatingId === w.id}
                                onClick={() => updateWorker(w.id, "reject")}
                                style={{
                                  background: "#FEF2F2",
                                  color: "#B91C1C",
                                  border: "1px solid #FECACA",
                                }}
                              >
                                Reject
                              </button>
                            )}
                            {w.verification_status !== "pending" && (
                              <button
                                type="button"
                                className="btn btnSm"
                                disabled={updatingId === w.id}
                                onClick={() => updateWorker(w.id, "pending")}
                                style={{
                                  background: "#FFFBEB",
                                  color: "#92400E",
                                  border: "1px solid #FDE68A",
                                }}
                              >
                                Pending
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--faint)", whiteSpace: "nowrap" }}>
                          {new Date(w.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="paginationRow">
              <span>
                Showing {filtered.length} of {workers.length} workers
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
