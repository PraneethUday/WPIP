import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "Worker Protection Insurance Platoform (WPIP) — Income Protection for Delivery Workers",
  description:
    "Parametric insurance for gig workers across Swiggy, Zomato, Blinkit & more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        {/* Apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gg_theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
