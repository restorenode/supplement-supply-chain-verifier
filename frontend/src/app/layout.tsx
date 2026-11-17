import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Supplement Supply Chain Verification Protocol",
    template: "%s · Supplement Supply Chain Verification"
  },
  description: "Check that a supplement's lab report is real. Verify batch attestations against a tamper-evident on-chain record."
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7F7" },
    { media: "(prefers-color-scheme: dark)", color: "#080D0F" }
  ]
};

// Runs before paint so the saved / system theme applies without a flash.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="sr-only">
          Skip to content
        </a>
        <AppHeader />
        <div id="main" className="page">
          {children}
        </div>
        <footer className="app-footer">
          <div className="container app-footer__inner">
            <span>SUPPLEMENT SUPPLY CHAIN VERIFICATION PROTOCOL</span>
            <span>HASH: KECCAK-256 · DOCUMENTS STAY OFF-CHAIN</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
