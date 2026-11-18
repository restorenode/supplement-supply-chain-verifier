"use client";

import { DragEvent, ReactNode, useRef, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { AlertIcon, CheckIcon, InfoDotIcon, LockIcon, UploadIcon, XIcon } from "@/components/icons";
import { Analyte } from "@/lib/api";
import { formatBytes } from "@/lib/format";

export type StepState = "locked" | "current" | "busy" | "done" | "failed";

export type LogEntry = { id: number; time: string; message: string; detail?: string; tone: "ok" | "bad" | "info" };

/* ---------- Pipeline step shell ---------- */

type PipelineStepProps = {
  index: number;
  title: string;
  state: StepState;
  isLast: boolean;
  lockText: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  error?: { title: string; message: string } | null;
  children?: ReactNode;
};

export function PipelineStep({ index, title, state, isLast, lockText, summary, open, onToggle, error, children }: PipelineStepProps) {
  const n = index + 1;
  return (
    <li className="pstep" aria-current={state === "current" || state === "busy" ? "step" : undefined}>
      <div className="pstep__rail">
        <span className={`pstep__marker pstep__marker--${state}`} aria-hidden="true">
          {state === "done" ? <CheckIcon size={14} /> : null}
          {state === "current" ? n : null}
          {state === "busy" ? <span className="pulse" /> : null}
          {state === "failed" ? <XIcon size={12} weight={2.4} /> : null}
          {state === "locked" ? <LockIcon size={12} /> : null}
        </span>
        {!isLast ? <span className={`pstep__line${state === "done" ? " pstep__line--done" : ""}`} /> : null}
      </div>
      <div className="pstep__content">
        <div className="pstep__head">
          <span className="pstep__num">STEP 0{n}</span>
          <h3 className="pstep__title">{title}</h3>
          <span className="pstep__spacer" />
          {state === "done" ? (
            <StatusBadge tone="ok" small icon={<CheckIcon size={10} weight={2.6} />}>
              Done
            </StatusBadge>
          ) : null}
          {state === "current" ? (
            <StatusBadge tone="ready" small>
              Ready
            </StatusBadge>
          ) : null}
          {state === "busy" ? (
            <StatusBadge tone="warn" small icon={<span className="dot pulse" style={{ width: 6, height: 6 }} />}>
              Working
            </StatusBadge>
          ) : null}
          {state === "failed" ? (
            <StatusBadge tone="bad" small icon={<XIcon size={10} weight={2.6} />}>
              Failed
            </StatusBadge>
          ) : null}
          {state === "locked" ? (
            <StatusBadge tone="locked" small>
              Locked
            </StatusBadge>
          ) : null}
        </div>

        {state === "locked" ? <p className="pstep__lock">{lockText}</p> : null}

        {state === "done" && summary ? (
          <div className="pstep__summary">
            <span className="pstep__summary-text">{summary}</span>
            {children ? (
              <button type="button" className="link-btn" onClick={onToggle} aria-expanded={open}>
                {open ? "Hide" : "Show details"}
              </button>
            ) : null}
          </div>
        ) : null}

        {state !== "locked" && (open || state !== "done") ? (
          <div className="pstep__body">
            {state === "failed" && error ? (
              <div className="banner" role="alert">
                <AlertIcon className="banner__icon" />
                <div style={{ minWidth: 0 }}>
                  <p className="banner__title">{error.title}</p>
                  <p className="banner__msg">{error.message}</p>
                </div>
              </div>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/* ---------- File drop zone ---------- */

type DropZoneProps = {
  file: File | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
};

export function DropZone({ file, disabled, onSelect, onClear }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onSelect(dropped);
  }

  return (
    <>
      <label
        className={`dropzone${dragging ? " dropzone--active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled}
          aria-label="Upload lab report PDF"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) onSelect(picked);
            event.target.value = "";
          }}
        />
        <span className="dropzone__icon">
          <UploadIcon size={18} />
        </span>
        <span className="dropzone__title">
          Drop the lab report PDF here, or <span className="dropzone__browse">browse</span>
        </span>
        <span className="label" style={{ letterSpacing: "0.08em" }}>
          CERTIFICATE OF ANALYSIS · PDF · MAX 20 MB
        </span>
      </label>
      {file ? <FileChip name={file.name} size={file.size} note="ready to upload" onClear={disabled ? undefined : onClear} /> : null}
    </>
  );
}

export function FileChip({ name, size, note, onClear }: { name: string; size: number; note: string; onClear?: () => void }) {
  return (
    <div className="file-chip">
      <span className="file-chip__doc" aria-hidden="true">
        PDF
      </span>
      <div className="file-chip__meta">
        <span className="file-chip__name" title={name}>
          {name}
        </span>
        <span className="file-chip__size">
          {formatBytes(size)} · {note}
        </span>
      </div>
      {onClear ? (
        <button type="button" className="hash__action hash__action--icon" onClick={onClear} aria-label="Remove file">
          <XIcon size={12} weight={2} />
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Extracted lab results ---------- */

export function ExtractedResults({ rows, labName, modelName }: { rows: Analyte[]; labName: string | null; modelName: string }) {
  const meta = [`${rows.length} RESULT${rows.length === 1 ? "" : "S"}`, labName?.toUpperCase(), `MODEL ${modelName.toUpperCase()}`]
    .filter(Boolean)
    .join(" · ");
  const empty = rows.length === 0;
  return (
    <div className="extract-box">
      <div className={`extract-box__head${empty ? " extract-box__head--warn" : ""}`}>
        <span className="extract-box__ok">
          {empty ? <AlertIcon size={14} /> : <CheckIcon size={14} />}
          {empty ? "No results found" : "Results extracted"}
        </span>
        <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
          {meta}
        </span>
      </div>
      {empty ? (
        <p className="extract-box__empty">
          No test results were found in this document. The fingerprint will still cover the batch details and the
          document itself. Use a text-based Certificate of Analysis to extract results.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table table--compact">
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.name}-${index}`}>
                  <td className="muted">{row.name ?? "Unnamed analyte"}</td>
                  <td className="mono" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                    {[row.result, row.unit].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="muted" style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12.5 }}>
                    {row.limit ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- JSON payload viewer ---------- */

export function PayloadViewer({ payload }: { payload: unknown }) {
  const lines = JSON.stringify(payload, null, 2).split("\n");
  return (
    <div className="code">
      <div className="code__head">
        <span>CANONICAL RECORD · JSON</span>
        <span>{lines.length} LINES</span>
      </div>
      <pre className="code__pre" tabIndex={0} aria-label="Canonical record JSON">
        {lines.map((line, index) => {
          const match = line.match(/^(\s*)("[^"]*":\s?)?(.*)$/);
          return (
            <div className="code__line" key={index}>
              <span className="code__n">{index + 1}</span>
              <span className="code__ind">{match?.[1]}</span>
              <span className="code__key">{match?.[2] ?? ""}</span>
              <span className="code__val">{match?.[3] ?? line}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/* ---------- Activity log ---------- */

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <aside className="card workspace__aside" aria-label="Activity">
      <header className="card__header" style={{ padding: "14px 18px" }}>
        <h2 className="card__title" style={{ whiteSpace: "nowrap" }}>
          Activity
        </h2>
        <span className="label" style={{ fontSize: 10.5 }}>
          LOCAL TIME
        </span>
      </header>
      {entries.length === 0 ? (
        <p className="faint" style={{ padding: "20px 18px", fontSize: 14 }}>
          No activity yet.
        </p>
      ) : (
        <ol className="log" aria-live="polite">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span className="log__time">{entry.time}</span>
              <span className={`log__icon log__icon--${entry.tone}`}>
                {entry.tone === "ok" ? <CheckIcon size={14} /> : null}
                {entry.tone === "bad" ? <XIcon size={14} /> : null}
                {entry.tone === "info" ? <InfoDotIcon size={14} /> : null}
                <span className="sr-only">{entry.tone === "ok" ? "Success" : entry.tone === "bad" ? "Error" : "Info"}</span>
              </span>
              <span className="log__msg">
                <span>{entry.message}</span>
                {entry.detail ? <span className="log__detail">{entry.detail}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
