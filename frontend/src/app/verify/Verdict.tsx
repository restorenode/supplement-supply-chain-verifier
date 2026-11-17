import Seal from "@/components/Seal";
import StatusBadge from "@/components/StatusBadge";
import { VerificationResult, VerificationStatus } from "@/lib/api";
import { formatUtc } from "@/lib/format";

type VerdictProps = {
  kind: VerificationStatus | "notfound";
  batchId: string;
  result?: VerificationResult;
  onRetry?: () => void;
};

/** The tinted verdict card at the top of a result: seal + plain-language answer. */
export default function Verdict({ kind, batchId, result, onRetry }: VerdictProps) {
  if (kind === "verified") {
    return (
      <div className="verdict verdict--ok rise">
        <Seal kind="verified" />
        <div className="verdict__body">
          <StatusBadge tone="ok" onSurface>
            Verified
          </StatusBadge>
          <h3 className="verdict__title">This lab data is authentic.</h3>
          <p className="verdict__text">
            The lab report on file matches the attestation published on-chain. It hasn&apos;t been changed since it was
            published.
          </p>
          <p className="verdict__meta">
            {batchId}
            {result?.publishedAt ? ` · ATTESTED ${formatUtc(result.publishedAt)}` : ""}
          </p>
        </div>
      </div>
    );
  }

  if (kind === "mismatch") {
    return (
      <div className="verdict verdict--bad rise">
        <Seal kind="mismatch" />
        <div className="verdict__body">
          <StatusBadge tone="bad" onSurface>
            Not verified
          </StatusBadge>
          <h3 className="verdict__title">This lab data doesn&apos;t match its on-chain record.</h3>
          <p className="verdict__text">
            The data on file differs from what was published. Don&apos;t rely on this lab report. Contact the
            manufacturer or retailer.
          </p>
          {result?.mismatchReason ? (
            <p className="verdict__reason">
              <strong>Reason:</strong> {result.mismatchReason}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (kind === "unpublished") {
    return (
      <div className="verdict verdict--warn rise">
        <Seal kind="pending" />
        <div className="verdict__body">
          <StatusBadge tone="warn" onSurface>
            Not published
          </StatusBadge>
          <h3 className="verdict__title">This batch hasn&apos;t been published on-chain yet.</h3>
          <p className="verdict__text">
            The manufacturer has registered this batch, but there&apos;s no on-chain record to check it against, so its
            lab data can&apos;t be verified yet.
          </p>
          {result?.mismatchReason ? (
            <p className="verdict__reason">
              <strong>Reason:</strong> {result.mismatchReason}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="verdict rise">
      <Seal kind="notfound" />
      <div className="verdict__body">
        <StatusBadge tone="none">Not found</StatusBadge>
        <h3 className="verdict__title">No batch found for {batchId}.</h3>
        <p className="verdict__text">
          Check the ID on the label. It&apos;s usually printed near the expiry date and looks like VA-2025-0001. If it
          still isn&apos;t found, this batch hasn&apos;t been registered.
        </p>
        {onRetry ? (
          <button type="button" className="btn btn--neutral" style={{ marginTop: 16, height: 40 }} onClick={onRetry}>
            Try another ID
          </button>
        ) : null}
      </div>
    </div>
  );
}
