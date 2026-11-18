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
          <h3 className="verdict__title">Record intact.</h3>
          <p className="verdict__text">
            The lab results on file match the sealed record exactly. Nothing has changed since publication.
          </p>
          <p className="verdict__meta">
            {batchId}
            {result?.publishedAt ? ` · SEALED ${formatUtc(result.publishedAt)}` : ""}
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
            Mismatch
          </StatusBadge>
          <h3 className="verdict__title">Record altered.</h3>
          <p className="verdict__text">
            The lab results on file no longer match the sealed record. Do not rely on this report. Contact the
            manufacturer or retailer.
          </p>
          {result?.mismatchReason ? (
            <p className="verdict__reason">
              <strong>Detail:</strong> {result.mismatchReason}
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
            Unsealed
          </StatusBadge>
          <h3 className="verdict__title">No sealed record yet.</h3>
          <p className="verdict__text">
            This batch is registered, but its results have not been sealed on-chain. There is nothing to verify against.
          </p>
          {result?.mismatchReason ? (
            <p className="verdict__reason">
              <strong>Detail:</strong> {result.mismatchReason}
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
        <StatusBadge tone="none">No record</StatusBadge>
        <h3 className="verdict__title">No record for {batchId}.</h3>
        <p className="verdict__text">
          Confirm the ID on the label. It is printed near the expiry date, in the form VA-2025-0001. An ID that cannot
          be found has not been registered.
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
