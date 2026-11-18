"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import Hash from "@/components/Hash";
import StatusBadge from "@/components/StatusBadge";
import { ExternalIcon, LockIcon } from "@/components/icons";
import {
  ApiError,
  Attestation,
  checkApiKey,
  createBatch,
  DocumentInfo,
  extractBatch,
  ExtractionResponse,
  getAttestation,
  publishBatch,
  PublishResult,
  uploadDocument
} from "@/lib/api";
import { BATCH_ID_PATTERN, clockTime, formatBytes, formatDate, MAX_UPLOAD_BYTES, truncateHash, txUrl } from "@/lib/format";
import {
  ActivityLog,
  DropZone,
  ExtractedResults,
  FileChip,
  LogEntry,
  PayloadViewer,
  PipelineStep,
  StepState
} from "@/app/admin/parts";

const TITLES = ["Register batch", "Attach certificate", "Extract results", "Compute fingerprint", "Seal on-chain"];
const CTA = ["Register batch", "Upload certificate", "Extract results", "Compute fingerprint", "Seal on-chain"];
const BUSY = ["Registering…", "Uploading…", "Extracting…", "Computing…", "Sealing… awaiting confirmation"];
const ERROR_TITLES = [
  "Registration failed",
  "Upload failed",
  "Extraction failed",
  "Computation failed",
  "Seal failed"
];

type Form = {
  batchId: string;
  productName: string;
  manufacturer: string;
  supplementType: string;
  productionDate: string;
  expiresDate: string;
};

type FieldKey = keyof Form;

const EMPTY_FORM: Form = {
  batchId: "",
  productName: "",
  manufacturer: "",
  supplementType: "",
  productionDate: "",
  expiresDate: ""
};

const FIELDS: Array<{ key: FieldKey; label: string; placeholder?: string; type?: string; mono?: boolean; optional?: boolean }> = [
  { key: "batchId", label: "Batch ID", placeholder: "VA-2025-0001", mono: true },
  { key: "productName", label: "Product Name", placeholder: "Magnesium Glycinate 400 mg" },
  { key: "manufacturer", label: "Manufacturer", placeholder: "Company name" },
  { key: "supplementType", label: "Supplement Type", placeholder: "e.g. Mineral, Vitamin" },
  { key: "productionDate", label: "Production Date", type: "date" },
  { key: "expiresDate", label: "Expires Date", type: "date", optional: true }
];

const INITIAL_STEPS: StepState[] = ["current", "locked", "locked", "locked", "locked"];

function validate(form: Form): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  const id = form.batchId.trim();
  if (!id) errors.batchId = "Enter a batch ID.";
  else if (id.length > 64) errors.batchId = "Use 64 characters or fewer.";
  else if (!BATCH_ID_PATTERN.test(id)) errors.batchId = "Use letters, numbers, dots, dashes or underscores, e.g. VA-2025-0001.";
  if (!form.productName.trim()) errors.productName = "Enter the product name.";
  if (!form.manufacturer.trim()) errors.manufacturer = "Enter the manufacturer.";
  if (!form.supplementType.trim()) errors.supplementType = "Enter the supplement type.";
  if (!form.productionDate) errors.productionDate = "Choose the production date.";
  if (form.expiresDate && form.productionDate && form.expiresDate < form.productionDate) {
    errors.expiresDate = "Must be on or after the production date.";
  }
  return errors;
}

function describeError(err: unknown): string {
  if (err instanceof ApiError && err.status === 401) {
    return "Publisher key rejected. Disconnect and reconnect with a valid key.";
  }
  return err instanceof Error ? err.message : "Request failed. Retry.";
}

function maskKey(key: string) {
  return `••••••••${key.slice(-4)}`;
}

export default function AdminClient() {
  // Access
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const connected = !!apiKey;

  // Pipeline
  const [steps, setSteps] = useState<StepState[]>(INITIAL_STEPS);
  const [errors, setErrors] = useState<Array<{ title: string; message: string } | null>>([null, null, null, null, null]);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<{ doc: DocumentInfo; size: number } | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [published, setPublished] = useState<PublishResult | null>(null);

  // Activity
  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useRef(0);

  const batchId = form.batchId.trim();
  const effective = steps.map((s) => (!connected && s !== "done" ? "locked" : s));
  const doneCount = effective.filter((s) => s === "done").length;

  function addLog(message: string, detail?: string, tone: LogEntry["tone"] = "ok") {
    const entry: LogEntry = { id: ++logId.current, time: clockTime(), message, detail, tone };
    setLog((prev) => [entry, ...prev].slice(0, 50));
  }

  function setStep(index: number, state: StepState) {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = state;
      if (state === "done" && index < next.length - 1 && next[index + 1] === "locked") next[index + 1] = "current";
      return next;
    });
  }

  function setError(index: number, value: { title: string; message: string } | null) {
    setErrors((prev) => prev.map((e, i) => (i === index ? value : e)));
  }

  /** Run one pipeline step: busy → done/failed, with logging. */
  async function runStep<T>(index: number, action: () => Promise<T>, onSuccess: (value: T) => [string, string?]) {
    if (!connected || steps[index] === "busy") return;
    setStep(index, "busy");
    setError(index, null);
    try {
      const value = await action();
      const [message, detail] = onSuccess(value);
      setStep(index, "done");
      addLog(message, detail);
    } catch (err) {
      const message = describeError(err);
      setStep(index, "failed");
      setError(index, { title: ERROR_TITLES[index], message });
      addLog(ERROR_TITLES[index], message, "bad");
    }
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = keyInput.trim();
    if (!key) return;
    setConnecting(true);
    setAccessError(null);
    try {
      await checkApiKey(key);
      setApiKey(key);
      setKeyInput("");
      addLog("Publisher key connected", maskKey(key));
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401 ? "Key rejected. Confirm the value and retry." : describeError(err);
      setAccessError(message);
      addLog("Key rejected", message, "bad");
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setApiKey("");
    setAccessError(null);
    addLog("Key disconnected", undefined, "info");
  }

  function submitBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(form);
    setFieldErrors(found);
    if (Object.keys(found).length) return;
    void runStep(
      0,
      () =>
        createBatch(
          {
            batchId,
            productName: form.productName.trim(),
            supplementType: form.supplementType.trim(),
            manufacturer: form.manufacturer.trim(),
            productionDate: form.productionDate,
            expiresDate: form.expiresDate || null
          },
          apiKey
        ),
      () => ["Batch registered", batchId]
    );
  }

  function selectFile(picked: File) {
    const isPdf = picked.type === "application/pdf" || picked.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("Only PDF lab reports are accepted.");
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      setFileError(`This file is ${formatBytes(picked.size)}. The limit is 20 MB.`);
      return;
    }
    setFileError(null);
    setFile(picked);
  }

  function upload() {
    if (!file) return;
    const picked = file;
    void runStep(
      1,
      () => uploadDocument(batchId, picked, apiKey),
      (doc) => {
        setUploaded({ doc, size: picked.size });
        return ["Certificate uploaded", `${doc.filename} · ${formatBytes(picked.size)}`];
      }
    );
  }

  function extract() {
    void runStep(
      2,
      () => extractBatch(batchId, apiKey),
      (result) => {
        setExtraction(result);
        setOpen((prev) => ({ ...prev, 2: true }));
        const count = result.extractedFields.analytes.length + result.extractedFields.contaminants.length;
        return ["Results extracted", `${count} result${count === 1 ? "" : "s"} · model ${result.modelInfo.modelName}`];
      }
    );
  }

  function buildAttestation() {
    void runStep(
      3,
      () => getAttestation(batchId, apiKey),
      (result) => {
        setAttestation(result);
        return ["Fingerprint computed", truncateHash(result.canonicalJsonHash)];
      }
    );
  }

  function publish() {
    addLog("Seal submitted", "awaiting confirmation", "info");
    void runStep(
      4,
      () => publishBatch(batchId, apiKey),
      (result) => {
        setPublished(result);
        return ["Sealed on-chain", `tx ${truncateHash(result.txHash)} · block ${result.blockNumber.toLocaleString("en-US")}`];
      }
    );
  }

  function startNewBatch() {
    setSteps(INITIAL_STEPS);
    setErrors([null, null, null, null, null]);
    setOpen({});
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFile(null);
    setFileError(null);
    setUploaded(null);
    setExtraction(null);
    setAttestation(null);
    setPublished(null);
    addLog("New batch started", undefined, "info");
  }

  const extractedRows = extraction ? [...extraction.extractedFields.analytes, ...extraction.extractedFields.contaminants] : [];
  const resultCount = extractedRows.length;

  const summaries = [
    `${batchId} · ${form.productName.trim()} · ${form.manufacturer.trim()}`,
    uploaded ? `${uploaded.doc.filename} · ${formatBytes(uploaded.size)}` : "",
    extraction ? `${resultCount} result${resultCount === 1 ? "" : "s"} extracted` : "",
    attestation ? `Fingerprint ${truncateHash(attestation.canonicalJsonHash)}` : "",
    published ? `tx ${truncateHash(published.txHash)}` : ""
  ];
  const defaultOpen = [false, false, true, true, true];

  function stepProps(index: number) {
    const state = effective[index];
    const isOpen = open[index] ?? defaultOpen[index];
    return {
      index,
      title: TITLES[index],
      state,
      isLast: index === TITLES.length - 1,
      lockText: !connected ? "Connect a publisher key to begin." : `Available after step 0${index}.`,
      summary: summaries[index],
      open: isOpen,
      onToggle: () => setOpen((prev) => ({ ...prev, [index]: !isOpen })),
      error: errors[index]
    };
  }

  function cta(index: number) {
    const state = effective[index];
    if (state === "busy") return BUSY[index];
    if (state === "failed") return `Retry · ${CTA[index].toLowerCase()}`;
    return CTA[index];
  }

  const explorer = txUrl(published?.txHash);

  return (
    <main className="container console">
      <div className="console__head">
        <div style={{ minWidth: 0 }}>
          <div className="label">PUBLISHER CONSOLE</div>
          <h1 className="console__title">Publish a batch record</h1>
          <p className="muted" style={{ maxWidth: 560 }}>
            Register a batch, attach its Certificate of Analysis, and seal its fingerprint on-chain.
          </p>
        </div>
        <div className="meter" aria-label={`Pipeline progress: ${doneCount} of 5 steps complete`}>
          <div className="meter__labels">
            <span>PIPELINE</span>
            <span>{doneCount} / 5 COMPLETE</span>
          </div>
          <div className="meter__segs" aria-hidden="true">
            {effective.map((state, index) => (
              <span
                key={index}
                className={`meter__seg${
                  state === "done"
                    ? " meter__seg--done"
                    : state === "failed"
                      ? " meter__seg--failed"
                      : state === "current" || state === "busy"
                        ? " meter__seg--active"
                        : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="card access" aria-label="Publisher key">
        <div className="access__who">
          <span className="access__icon">
            <LockIcon size={15} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Publisher key</span>
            <span className="faint" style={{ fontSize: 12 }}>
              Held in memory for this session only.
            </span>
          </div>
        </div>
        {connected ? (
          <div className="access__state">
            <StatusBadge tone="ok">Connected</StatusBadge>
            <span className="mono muted" style={{ fontSize: 13, letterSpacing: "0.04em" }}>
              {maskKey(apiKey)}
            </span>
            <button type="button" className="btn btn--neutral btn--sm" style={{ marginLeft: "auto" }} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <form className="access__form" onSubmit={connect}>
            <label className="prefixed">
              <span className="prefixed__label">KEY</span>
              <input
                type="password"
                className="prefixed__input"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder="Paste ADMIN_API_KEY"
                autoComplete="off"
                aria-label="Publisher key"
                aria-invalid={accessError ? true : undefined}
              />
            </label>
            <button type="submit" className="btn btn--commit" disabled={connecting || !keyInput.trim()}>
              {connecting ? "Connecting…" : "Connect"}
            </button>
            {accessError ? (
              <span className="field__error access__error" role="alert">
                {accessError}
              </span>
            ) : null}
          </form>
        )}
      </section>

      <div className="workspace">
        <section className="card workspace__main" aria-label="Pipeline">
          <header className="card__header" style={{ padding: "14px clamp(16px, 2.4vw, 24px)" }}>
            <h2 className="card__title">Pipeline</h2>
            {effective[0] === "done" ? (
              <span className="mono muted" style={{ fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                BATCH · {batchId}
              </span>
            ) : null}
          </header>
          <ol className="pipeline">
            {/* Step 1 — create batch */}
            <PipelineStep {...stepProps(0)}>
              {effective[0] === "done" ? (
                <dl className="dl" style={{ padding: 0 }}>
                  {FIELDS.map((field) => (
                    <div className="dl__row" key={field.key}>
                      <dt>{field.label}</dt>
                      <dd className={field.mono ? "mono" : undefined}>
                        {field.type === "date" ? formatDate(form[field.key]) : form[field.key] || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <form onSubmit={submitBatch} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="form-grid">
                    {FIELDS.map((field) => {
                      const error = fieldErrors[field.key];
                      const errorId = `${field.key}-error`;
                      return (
                        <label className="field" key={field.key}>
                          <span className="field__label">
                            {field.label}
                            {field.optional ? <span className="field__optional"> (optional)</span> : null}
                          </span>
                          <input
                            className={`input${field.mono ? " input--mono" : ""}`}
                            type={field.type ?? "text"}
                            value={form[field.key]}
                            placeholder={field.placeholder}
                            spellCheck={field.mono ? false : undefined}
                            maxLength={field.key === "batchId" ? 64 : 255}
                            disabled={effective[0] === "busy"}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? errorId : undefined}
                            onChange={(event) => {
                              const value = event.target.value;
                              setForm((prev) => ({ ...prev, [field.key]: value }));
                              if (error) setFieldErrors((prev) => ({ ...prev, [field.key]: undefined }));
                            }}
                          />
                          {error ? (
                            <span className="field__error" id={errorId}>
                              {error}
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                  <div className="actions">
                    <button type="submit" className="btn btn--primary" disabled={effective[0] === "busy"}>
                      {effective[0] === "busy" ? <span className="dot pulse" /> : null}
                      {cta(0)}
                    </button>
                    <span className="actions__note">Expiry date is optional. All other fields are required.</span>
                  </div>
                </form>
              )}
            </PipelineStep>

            {/* Step 2 — upload lab report */}
            <PipelineStep {...stepProps(1)}>
              {effective[1] === "done" && uploaded ? (
                <FileChip name={uploaded.doc.filename} size={uploaded.size} note="stored off-chain" />
              ) : (
                <>
                  <DropZone
                    file={file}
                    disabled={effective[1] === "busy"}
                    onSelect={selectFile}
                    onClear={() => setFile(null)}
                  />
                  {fileError ? (
                    <span className="field__error" role="alert">
                      {fileError}
                    </span>
                  ) : null}
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={upload}
                      disabled={!file || effective[1] === "busy"}
                    >
                      {effective[1] === "busy" ? <span className="dot pulse" /> : null}
                      {cta(1)}
                    </button>
                    <span className="actions__note">
                      The PDF is stored off-chain. For testing:{" "}
                      <a href="/samples/sample-coa.pdf" download="sample-coa.pdf">
                        sample certificate (PDF)
                      </a>
                    </span>
                  </div>
                </>
              )}
            </PipelineStep>

            {/* Step 3 — extraction */}
            <PipelineStep {...stepProps(2)}>
              {extraction ? (
                <ExtractedResults
                  rows={extractedRows}
                  labName={extraction.extractedFields.labName}
                  modelName={extraction.modelInfo.modelName}
                />
              ) : (
                <>
                  <p className="muted" style={{ fontSize: 14 }}>
                    Extract test results from{" "}
                    <span className="mono" style={{ fontSize: 13, color: "var(--ink)" }}>
                      {uploaded?.doc.filename ?? "the uploaded PDF"}
                    </span>
                    .
                  </p>
                  <div>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={extract}
                      disabled={effective[2] === "busy"}
                    >
                      {effective[2] === "busy" ? <span className="dot pulse" /> : null}
                      {cta(2)}
                    </button>
                  </div>
                </>
              )}
            </PipelineStep>

            {/* Step 4 — attestation */}
            <PipelineStep {...stepProps(3)}>
              {attestation ? (
                <>
                  <div className="proof__col" style={{ flex: "none" }}>
                    <span className="label">Fingerprint · Keccak-256</span>
                    <Hash value={attestation.canonicalJsonHash} label="fingerprint" />
                  </div>
                  <PayloadViewer payload={attestation.canonicalJson} />
                </>
              ) : (
                <>
                  <div className="empty-state" style={{ padding: 16, alignItems: "flex-start", textAlign: "left" }}>
                    The fingerprint covers the batch details, the test results, and the document itself.
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={buildAttestation}
                      disabled={effective[3] === "busy"}
                    >
                      {effective[3] === "busy" ? <span className="dot pulse" /> : null}
                      {cta(3)}
                    </button>
                  </div>
                </>
              )}
            </PipelineStep>

            {/* Step 5 — publish */}
            <PipelineStep {...stepProps(4)}>
              {published ? (
                <>
                  <div className="published-box">
                    <div className="proof__col">
                      <span className="label">Transaction</span>
                      <Hash value={published.txHash} href={explorer} label="transaction hash" />
                    </div>
                    <div className="proof__col" style={{ gap: 2, paddingBottom: 2 }}>
                      <span className="mono muted" style={{ fontSize: 12 }}>
                        Block #{published.blockNumber.toLocaleString("en-US")}
                        {attestation?.chain ? ` · ${attestation.chain.toUpperCase()}` : ""}
                      </span>
                      {explorer ? (
                        <a href={explorer} target="_blank" rel="noreferrer" className="ext-link">
                          View on block explorer
                          <ExternalIcon size={13} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="actions">
                    <Link href={`/verify?batch=${encodeURIComponent(batchId)}`} className="btn btn--neutral">
                      View public verification
                    </Link>
                    <button type="button" className="btn btn--ghost" onClick={startNewBatch}>
                      Publish another batch
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="muted" style={{ fontSize: 14, maxWidth: 560 }}>
                    Writes the fingerprint to the chain. This is permanent. The record itself remains off-chain.
                  </p>
                  <div>
                    <button
                      type="button"
                      className="btn btn--commit"
                      onClick={publish}
                      disabled={effective[4] === "busy"}
                    >
                      {effective[4] === "busy" ? <span className="dot pulse" /> : null}
                      {cta(4)}
                    </button>
                  </div>
                </>
              )}
            </PipelineStep>
          </ol>
        </section>

        <ActivityLog entries={log} />
      </div>
    </main>
  );
}
