/** Shorten a 0x hash for display: first 6 + last 4 characters (design rule "truncate 6 + 4"). */
export function truncateHash(value: string): string {
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });

/** Format an ISO date (YYYY-MM-DD) as e.g. "Jan 12, 2025". Dates are calendar dates, so render in UTC. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : DATE_FMT.format(date);
}

/** Format a timestamp as "2025-01-14 09:41 UTC". */
export function formatUtc(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function formatBytes(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function clockTime(date = new Date()): string {
  return date.toTimeString().slice(0, 8);
}

const EXPLORER_BASE = (process.env.NEXT_PUBLIC_TX_EXPLORER_BASE_URL || "").replace(/\/$/, "");

/** Block-explorer link for a transaction, or undefined when no explorer is configured. */
export function txUrl(txHash: string | null | undefined): string | undefined {
  if (!txHash || !EXPLORER_BASE || !/^0x[0-9a-fA-F]+$/.test(txHash)) return undefined;
  return `${EXPLORER_BASE}/${txHash}`;
}

/** Mirror of the backend's batch ID rule (URL-safe, max 64 characters). */
export const BATCH_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
