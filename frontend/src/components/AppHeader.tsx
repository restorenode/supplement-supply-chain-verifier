"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeIcon } from "@/components/icons";
import LogoMark from "@/components/LogoMark";

type Theme = "light" | "dark";

const NAV = [
  { href: "/verify", label: "Verify" },
  { href: "/admin", label: "Publisher" }
];

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage may be blocked; the toggle still works for this page view.
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      <ThemeIcon size={18} />
    </button>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <Link href="/" className="brand" aria-label="Supplement Supply Chain Verification Protocol, home">
          <LogoMark />
          <span className="brand__text">
            <span className="brand__name">Supplement Supply Chain</span>
            <span className="brand__sub">VERIFICATION PROTOCOL</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav__link"
              aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <span className="nav__divider" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
