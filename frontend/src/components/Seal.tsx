import { CheckIcon, ClockIcon, SearchIcon, XIcon } from "@/components/icons";

export type SealKind = "verified" | "mismatch" | "pending" | "notfound";

const SEALS: Record<SealKind, { tone: string; text: string; icon: JSX.Element; stamp: boolean }> = {
  verified: { tone: "ok", text: "VERIFIED", icon: <CheckIcon size={36} weight={1.6} />, stamp: true },
  mismatch: { tone: "bad", text: "MISMATCH", icon: <XIcon size={32} weight={1.6} />, stamp: true },
  pending: { tone: "warn", text: "UNSEALED", icon: <ClockIcon size={30} weight={1.5} />, stamp: false },
  notfound: { tone: "none", text: "NO RECORD", icon: <SearchIcon size={28} weight={1.5} />, stamp: false }
};

/** The one-second answer: a stamped seal. Verified/mismatch stamp in; pending/not-found don't animate. */
export default function Seal({ kind, small }: { kind: SealKind; small?: boolean }) {
  const seal = SEALS[kind];
  const className = ["seal", `seal--${seal.tone}`, seal.stamp ? "seal--stamp" : "", small ? "seal--sm" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className} aria-hidden="true">
      <div className="seal__inner">
        {seal.icon}
        {small ? null : <span className="seal__text">{seal.text}</span>}
      </div>
    </div>
  );
}
