type VerificationBadgeProps = {
  status: "verified" | "mismatch" | "unverified";
};

const LABELS: Record<VerificationBadgeProps["status"], string> = {
  verified: "Verified ✅",
  unverified: "Not Verified ❌",
  mismatch: "Mismatch ⚠️"
};

export default function VerificationBadge({ status }: VerificationBadgeProps) {
  return <span className={`verify-badge ${status}`}>{LABELS[status]}</span>;
}
