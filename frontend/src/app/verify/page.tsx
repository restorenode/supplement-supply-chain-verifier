"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Input from "@/components/Input";
import VerificationBadge from "@/components/VerificationBadge";
import { verifyBatch, VerificationResult } from "@/lib/api";

const explorerBase = (process.env.NEXT_PUBLIC_TX_EXPLORER_BASE_URL || "").replace(/\/$/, "");

function truncateHash(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export default function VerifyPage() {
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  async function handleVerify(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!batchId.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifyBatch(batchId.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  // "mismatch" = an on-chain hash exists but differs; "unverified" = nothing published on-chain.
  const badgeStatus = result
    ? result.verified
      ? "verified"
      : result.onchainHash
        ? "mismatch"
        : "unverified"
    : null;

  return (
    <div className="grid grid-2">
      <Card title="Verify a batch">
        <form className="stack" onSubmit={handleVerify}>
          <Field label="Batch ID" hint="Example: VA-2025-0001">
            <Input value={batchId} onChange={(event) => setBatchId(event.target.value)} />
          </Field>
          <Button type="submit" disabled={!batchId.trim() || loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
        {error ? <p className="message error" role="alert">{error}</p> : null}
      </Card>
      <Card title="Verification Result">
        {loading ? (
          <p>Checking the registry and hashes...</p>
        ) : result ? (
          <div className="result stack">
            {badgeStatus ? <VerificationBadge status={badgeStatus} /> : null}
            <div>
              <strong>Off-chain Hash:</strong>
              <div className="hash-block" title={result.offchainHash}>
                {truncateHash(result.offchainHash)}
              </div>
            </div>
            <div>
              <strong>On-chain Hash:</strong>
              {result.onchainHash ? (
                <div className="hash-block" title={result.onchainHash}>
                  {truncateHash(result.onchainHash)}
                </div>
              ) : (
                <div className="hash-block muted">Not published</div>
              )}
            </div>
            <div>
              <strong>Reason:</strong> {result.mismatchReason ?? "Hashes match"}
            </div>
            {result.txHash ? (
              <div>
                <strong>Transaction:</strong>
                {explorerBase ? (
                  <a href={`${explorerBase}/${result.txHash}`} className="tx-link" target="_blank" rel="noreferrer">
                    {truncateHash(result.txHash)}
                  </a>
                ) : (
                  <div className="hash-block" title={result.txHash}>{truncateHash(result.txHash)}</div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <p>Submit a batch ID to see verification details.</p>
        )}
      </Card>
    </div>
  );
}
