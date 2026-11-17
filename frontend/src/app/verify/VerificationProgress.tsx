import { CheckIcon } from "@/components/icons";

const CHECKS = [
  { label: "Registry lookup", detail: "Locating the batch record" },
  { label: "Off-chain record", detail: "Recomputing the Keccak-256 hash of the stored lab data" },
  { label: "On-chain attestation", detail: "Reading the published hash" },
  { label: "Comparison", detail: "Matching both hashes" }
];

export const CHECK_COUNT = CHECKS.length;

/** "Checking the registry and hashes..." — a precise check in progress, not a spinner. */
export default function VerificationProgress({ step }: { step: number }) {
  const current = Math.min(step, CHECK_COUNT - 1);
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="progress">
        <div className="progress__bar" style={{ width: `${Math.min(100, (step / CHECK_COUNT) * 100 + 8)}%` }} />
        <div className="progress__scan" />
      </div>
      <div className="checks__head">
        <p className="checks__title">Checking the registry and hashes...</p>
        <span className="mono faint" style={{ fontSize: 12 }}>
          STEP {current + 1} / {CHECK_COUNT}
        </span>
      </div>
      <ol className="checks">
        {CHECKS.map((check, index) => {
          const state = index < step ? "done" : index === step ? "running" : "queued";
          return (
            <li key={check.label}>
              <span className={`check-mark check-mark--${state}`}>
                {state === "done" ? <CheckIcon size={12} /> : null}
                {state === "running" ? <span className="pulse" /> : null}
              </span>
              <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span className="checks__label">{check.label}</span>
                <span className="checks__detail">{check.detail}</span>
              </span>
              <span className="label" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
                {state === "done" ? "Done" : state === "running" ? "Running" : "Queued"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
