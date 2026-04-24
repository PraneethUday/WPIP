export default function SettingsPage() {
  return (
    <div>
      <div className="pageHead">
        <div>
          <h1 className="pageTitle">Settings</h1>
          <p className="pageSubtitle">
            Platform configuration, notification preferences, and admin access management.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          {
            section: "General",
            items: [
              { label: "Platform Name", value: "InsureGuard Admin Portal", type: "text" },
              { label: "Admin Email", value: "admin@insureguard.in", type: "email" },
              { label: "Timezone", value: "Asia/Kolkata (IST)", type: "select" },
            ],
          },
          {
            section: "Notifications",
            items: [
              { label: "New Claim Alerts", value: "Enabled", type: "toggle" },
              { label: "Disruption Alerts", value: "Enabled", type: "toggle" },
              { label: "Support Escalations", value: "Enabled", type: "toggle" },
            ],
          },
          {
            section: "Security",
            items: [
              { label: "Two-Factor Authentication", value: "Not configured", type: "action" },
              { label: "Session Timeout", value: "30 minutes", type: "select" },
              { label: "API Access Keys", value: "3 active keys", type: "action" },
            ],
          },
        ].map(({ section, items }) => (
          <div key={section} className="card">
            <div className="sectionHead">
              <div className="sectionTitle">{section}</div>
            </div>
            <div style={{ padding: "8px 0" }}>
              {items.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 24px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "var(--white)" }}>
                      {item.label}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: "var(--faint)" }}>{item.value}</span>
                    <button
                      type="button"
                      className="btn btnSecondary btnSm"
                    >
                      {item.type === "action" ? "Configure" : "Edit"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div
          className="card cardPad"
          style={{ borderColor: "#FCA5A5", background: "#FFF5F5" }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: "#991B1B", marginBottom: 6 }}>
            Danger Zone
          </div>
          <div style={{ fontSize: 13, color: "#B91C1C", marginBottom: 16 }}>
            These actions are irreversible. Proceed with extreme caution.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn btnSm"
              style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" }}
            >
              Reset All Claims
            </button>
            <button
              type="button"
              className="btn btnSm"
              style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" }}
            >
              Clear Worker Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
