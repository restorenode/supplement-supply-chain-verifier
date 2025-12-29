import "./globals.css";
import "./styles.css";
import Link from "next/link";

export const metadata = {
  title: "Ethical Supplement Verifier",
  description: "Verify supplement batch attestations and manage publisher workflows."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="header">
            <div>
              <h1>Ethical Supplement Supply Chain Verifier</h1>
              <p>Trace, verify, and publish batch attestations with a tamper-evident chain.</p>
            </div>
            <nav className="grid" style={{ gridAutoFlow: "column" }}>
              <Link href="/verify">Verify</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
