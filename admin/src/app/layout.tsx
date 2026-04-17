import type { Metadata } from "next";
import "./globals.css";
import AdminNavbar from "@/components/AdminNavbar";

export const metadata: Metadata = {
  title: "Worker Protection Insurance Platoform (WPIP) Admin",
  description: "WPIP admin dashboard server",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="adminRoot">
          <AdminNavbar />
          <div className="adminViewport">{children}</div>
        </div>
      </body>
    </html>
  );
}
