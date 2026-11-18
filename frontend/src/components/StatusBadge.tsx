import { ReactNode } from "react";
import { CheckIcon, ClockIcon, LockIcon, SearchIcon, XIcon } from "@/components/icons";

export type Tone = "ok" | "warn" | "bad" | "none" | "ready" | "locked";

const ICONS: Record<Tone, ReactNode> = {
  ok: <CheckIcon size={12} />,
  warn: <ClockIcon size={12} />,
  bad: <XIcon size={12} />,
  none: <SearchIcon size={12} />,
  ready: <span className="dot" style={{ width: 6, height: 6 }} />,
  locked: <LockIcon size={10} />
};

type StatusBadgeProps = {
  tone: Tone;
  children: ReactNode;
  small?: boolean;
  onSurface?: boolean;
  icon?: ReactNode;
};

/** Pill badge: always icon + text, never color alone. */
export default function StatusBadge({ tone, children, small, onSurface, icon }: StatusBadgeProps) {
  const toneClass = tone === "none" ? "" : `badge--${tone}`;
  const className = ["badge", toneClass, small ? "badge--sm" : "", onSurface ? "badge--on-surface" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={className}>
      {icon ?? ICONS[tone]}
      {children}
    </span>
  );
}
