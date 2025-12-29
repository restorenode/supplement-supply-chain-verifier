"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Input from "@/components/Input";
import { verifyBatch, VerificationResult } from "@/lib/api";

export default function VerifyPage() {
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  async function handleVerify() {
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

  return (
    <div className="grid grid-2">
      <Card title="Verify a batch">
        <Field label="Batch ID" hint="Example: VA-2025-0001">
          <Input value={batchId} onChange={(event) => setBatchId(event.target.value)} />
        </Field>
        <Button onClick={handleVerify} disabled={!batchId || loading}>
          {loading ? "Verifying..." : "Verify"}
        </Button>
        {error ? <p>{error}</p> : null}
      </Card>
      <Card title="Verification Result">
        {result ? (
          <div className="result stack">
            <div>
              <strong>Status:</strong> {result.verified ? "Verified" : "Unverified"}
            </div>
            <div>
              <strong>Off-chain Hash:</strong>
              <div className="code-block">{result.offchainHash}</div>
            </div>
            <div>
              <strong>On-chain Hash:</strong>
              <div className="code-block">{result.onchainHash ?? "Not published"}</div>
            </div>
            <div>
              <strong>Reason:</strong> {result.mismatchReason ?? "Hashes match"}
            </div>
          </div>
        ) : (
          <p>Submit a batch ID to see verification details.</p>
        )}
      </Card>
    </div>
  );
}
