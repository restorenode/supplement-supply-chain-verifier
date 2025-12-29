import "./globals.css";
import "./styles.css";
import Link from "next/link";

export const metadata = {
  title: "Supplement Supply Chain Verification Protocol",
  description: "Verify supplement batches and publish attestations over a tamper-evident chain."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="header">
            <div>
              <h1>Supplement Supply Chain Verification Protocol</h1>
              <p>Trace, verify, and publish supplement batch attestations with a tamper-evident chain.</p>
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
