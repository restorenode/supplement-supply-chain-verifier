import Link from "next/link";
import Card from "@/components/Card";

export default function HomePage() {
  return (
    <div className="grid grid-2">
      <Card title="Public Verification">
        <p>Check a batch attestation against its on-chain hash.</p>
        <Link className="badge" href="/verify">Go to Verify</Link>
      </Card>
      <Card title="Publisher Admin">
        <p>Create batches, upload lab reports, extract data, and publish attestations.</p>
        <Link className="badge" href="/admin">Go to Admin</Link>
      </Card>
    </div>
  );
}
