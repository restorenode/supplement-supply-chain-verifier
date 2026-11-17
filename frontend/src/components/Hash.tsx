"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CopyIcon, ExternalIcon } from "@/components/icons";
import { truncateHash } from "@/lib/format";

type HashProps = {
  value?: string | null;
  href?: string;
  placeholder?: string;
  label?: string;
};

/** Monospaced hash display: truncated 6 + 4, full value on hover/focus, copy + optional explorer link. */
export default function Hash({ value, href, placeholder = "Not available", label = "hash" }: HashProps) {
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const tooltipId = useId();

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!value) {
    return (
      <div className="hash">
        <span className="hash__empty">{placeholder}</span>
      </div>
    );
  }

  const long = value.length > 14;

  async function copy() {
    try {
      await navigator.clipboard?.writeText(value as string);
    } catch {
      // Clipboard can be unavailable (permissions / insecure context); the value is still selectable.
    }
    clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="hash" onMouseEnter={() => setShowFull(true)} onMouseLeave={() => setShowFull(false)}>
      <span
        className="hash__value"
        title={value}
        tabIndex={long ? 0 : undefined}
        aria-label={`${label}: ${value}`}
        aria-describedby={long && showFull ? tooltipId : undefined}
        onFocus={() => setShowFull(true)}
        onBlur={() => setShowFull(false)}
      >
        {truncateHash(value)}
      </span>
      {href ? (
        <a
          className="hash__action hash__action--icon"
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in block explorer"
          title="Open in block explorer"
        >
          <ExternalIcon size={14} />
        </a>
      ) : null}
      <button type="button" className="hash__action" onClick={copy} aria-label={`Copy full ${label}`}>
        <CopyIcon size={13} />
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
      {long && showFull ? (
        <div role="tooltip" id={tooltipId} className="hash__tooltip">
          {value}
        </div>
      ) : null}
    </div>
  );
}
