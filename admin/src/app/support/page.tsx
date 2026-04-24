"use client";
import React, { useEffect, useState } from "react";

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

function TicketStatusBadge({ status }: { status: string }) {
  if (status === "resolved") return <span className="badge badgeGreen">Resolved</span>;
  if (status === "in_progress") return <span className="badge badgeBlue">In Progress</span>;
  return <span className="badge badgeAmber">Open</span>;
}

const IconRefresh = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
    <path d="M12.25 7A5.25 5.25 0 1 1 7 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 1.75L9.5 4.25 7 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/support/tickets")
      .then((r) => r.json())
      .then((data) => { if (data.tickets) setTickets(data.tickets); })
      .catch(() => setError("Failed to load tickets"))
      .finally(() => setLoading(false));
  };

  const updateTicket = async (ticketId: string, status: "open" | "in_progress" | "resolved") => {
    setUpdatingId(ticketId);
    setNotice("");
    setError("");
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Failed to update ticket"); return; }
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t)));
      setNotice(`Ticket moved to ${status.replace("_", " ")}.`);
    } catch {
      setError("Failed to update ticket");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEscalation = async (ticketId: string, claimId: string, action: "approved" | "rejected") => {
    setUpdatingId(ticketId);
    setNotice("");
    setError("");
    try {
      const claimRes = await fetch("/api/claims/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, status: action }),
      });
      const claimData = await claimRes.json();
      if (!claimRes.ok || claimData.error) { setError(claimData.error || "Failed to update claim"); return; }
      await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      setNotice(`Claim ${action} and ticket resolved.`);
      fetchTickets();
    } catch {
      setError("Failed to process escalation");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tickets.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchType = typeFilter === "all" || t.ticket_type === typeFilter;
    return matchStatus && matchType;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    escalations: tickets.filter((t) => t.ticket_type === "claim_escalation").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">Support & Escalations</h1>
          <p className="pageSubtitle">
            Worker support requests and claim escalation tickets requiring admin action.
          </p>
        </div>
        <div className="pageActions">
          <button type="button" className="btn btnSecondary" onClick={fetchTickets}>
            <IconRefresh /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        className="gridStats"
        style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 24 }}
      >
        {[
          { label: "Total Tickets", value: loading ? "—" : stats.total },
          { label: "Open", value: loading ? "—" : stats.open },
          { label: "In Progress", value: loading ? "—" : stats.inProgress },
          { label: "Resolved", value: loading ? "—" : stats.resolved },
          { label: "Escalations", value: loading ? "—" : stats.escalations },
        ].map(({ label, value }) => (
          <div key={label} className="statCard">
            <div className="statLabel">{label}</div>
            <div className="statValue">{value}</div>
          </div>
        ))}
      </div>

      {notice && <div className="alertSuccess">{notice}</div>}
      {error && <div className="alertError">{error}</div>}

      {/* Table */}
      <div className="card">
        <div className="sectionHead">
          <div className="sectionTitle">Support Tickets</div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              <option value="support">Support</option>
              <option value="claim_escalation">Escalation</option>
            </select>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No support tickets found.</div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Type</th>
                  <th>Issue</th>
                  <th>Claim #</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {ticket.worker_name || ticket.delivery_id || "Unknown"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--faint)" }}>
                        {ticket.worker_email || ticket.worker_id}
                      </div>
                    </td>
                    <td>
                      {ticket.ticket_type === "claim_escalation" ? (
                        <span className="badge badgeAmber">Escalation</span>
                      ) : (
                        <span className="badge badgeBlue">Support</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                        {ticket.subject}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--faint)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 280,
                        }}
                        title={ticket.message}
                      >
                        {ticket.message}
                      </div>
                    </td>
                    <td>
                      {ticket.claim_number ? (
                        <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                          {ticket.claim_number}
                        </span>
                      ) : (
                        <span style={{ color: "var(--faint)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td style={{ fontSize: 12, color: "var(--faint)", whiteSpace: "nowrap" }}>
                      {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {ticket.status === "open" && (
                          <button
                            type="button"
                            className="btn btnSm"
                            disabled={updatingId === ticket.id}
                            onClick={() => updateTicket(ticket.id, "in_progress")}
                            style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}
                          >
                            In Progress
                          </button>
                        )}
                        {ticket.status === "in_progress" && ticket.ticket_type !== "claim_escalation" && (
                          <button
                            type="button"
                            className="btn btnSm"
                            disabled={updatingId === ticket.id}
                            onClick={() => updateTicket(ticket.id, "resolved")}
                            style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #86EFAC" }}
                          >
                            Resolve
                          </button>
                        )}
                        {ticket.status === "resolved" && (
                          <button
                            type="button"
                            className="btn btnSm btnOutline"
                            disabled={updatingId === ticket.id}
                            onClick={() => updateTicket(ticket.id, "open")}
                          >
                            Reopen
                          </button>
                        )}
                        {ticket.ticket_type === "claim_escalation" &&
                          ticket.claim_id &&
                          ticket.status !== "resolved" && (
                            <>
                              <button
                                type="button"
                                className="btn btnSm"
                                disabled={updatingId === ticket.id}
                                onClick={() => handleEscalation(ticket.id, ticket.claim_id!, "approved")}
                                style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #86EFAC" }}
                              >
                                Approve Claim
                              </button>
                              <button
                                type="button"
                                className="btn btnSm"
                                disabled={updatingId === ticket.id}
                                onClick={() => handleEscalation(ticket.id, ticket.claim_id!, "rejected")}
                                style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
                              >
                                Reject Claim
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
