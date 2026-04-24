import Link from "next/link";

const IconFile = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 40 40">
    <rect x="6" y="4" width="22" height="32" rx="3" stroke="#CBD5E1" strokeWidth="2" />
    <path d="M12 13h12M12 19h12M12 25h8" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    <path d="M28 4v10h6" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const REPORT_TYPES = [
  {
    title: "Worker Registration Report",
    desc: "Summary of all registered workers by status, tier, city, and platform.",
    href: "/workers",
    badge: "Workers",
  },
  {
    title: "Claims Payout Report",
    desc: "Detailed breakdown of all claim payouts, fraud scores, and approval rates.",
    href: "/claims",
    badge: "Claims",
  },
  {
    title: "Disruption Events Report",
    desc: "Historical log of all parametric trigger events and weather disruptions.",
    href: "/disruptions",
    badge: "Disruptions",
  },
  {
    title: "Platform Earnings Report",
    desc: "Platform-wise earnings distribution, delivery counts, and income analytics.",
    href: "/analytics",
    badge: "Analytics",
  },
  {
    title: "Support Ticket Summary",
    desc: "Open, in-progress, and resolved support tickets with escalation breakdown.",
    href: "/support",
    badge: "Support",
  },
];

export default function ReportsPage() {
  return (
    <div>
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">Reports</h1>
          <p className="pageSubtitle">
            Generate and export operational reports across all sections of the platform.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {REPORT_TYPES.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            style={{ textDecoration: "none" }}
          >
            <div
              className="card cardPad"
              style={{
                cursor: "pointer",
                transition: "box-shadow 0.15s",
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <IconFile />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "#2563EB",
                  background: "#DBEAFE",
                  borderRadius: 4,
                  padding: "2px 8px",
                  display: "inline-block",
                  marginBottom: 10,
                }}
              >
                {r.badge}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 6 }}>
                {r.title}
              </div>
              <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div
        className="card cardPad"
        style={{ textAlign: "center", borderStyle: "dashed", background: "#FAFBFC" }}
      >
        <div style={{ color: "#CBD5E1", marginBottom: 12 }}>
          <IconFile />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#475569", marginBottom: 6 }}>
          Custom Reports Coming Soon
        </div>
        <div style={{ fontSize: 13, color: "#94A3B8" }}>
          Date-range filtering, CSV export, and scheduled report delivery will be available in a future release.
        </div>
      </div>
    </div>
  );
}
