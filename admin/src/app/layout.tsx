import type { Metadata } from "next";
import "./globals.css";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = {
  title: "InsureGuard Admin Portal",
  description: "Worker Protection Insurance Platform — Admin Dashboard",
};

const IconSearch = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="#94A3B8" strokeWidth="1.4" />
    <path d="M10 10l3 3" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="appShell">
          <div className="appSidebar">
            <AdminSidebar />
          </div>

          <div className="appContent">
            {/* Top bar */}
            <div className="appTopBar">
              <form className="topbarSearch" action="/claims" method="get">
                <IconSearch />
                <input
                  name="q"
                  placeholder="Search claim #, worker, city, platform, trigger..."
                />
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#475569",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate()}
                </div>
              </div>
            </div>

            {/* Page content */}
            <main className="appMain">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
