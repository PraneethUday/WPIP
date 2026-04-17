"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNavbar.module.css";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/disruptions", label: "Disruptions" },
  { href: "/control-center", label: "Control Center" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <header className={styles.navRoot}>
      <div className={styles.navInner}>
        <div className={styles.brandWrap}>
          <div className={styles.brandBadge}>GG</div>
          <div className={styles.brandText}>
            <p className={styles.brandTitle}>WPIP Admin</p>
            <p className={styles.brandSub}>Operations Console</p>
          </div>
        </div>

        <nav className={styles.navLinks}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
