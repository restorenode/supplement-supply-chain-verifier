"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import BatchIdForm from "@/components/BatchIdForm";
import { AlertIcon, CheckIcon, SearchIcon } from "@/components/icons";
import { ApiError, verifyBatch, VerificationResult } from "@/lib/api";
import VerificationDetails from "@/app/verify/VerificationDetails";
import VerificationProgress, { CHECK_COUNT } from "@/app/verify/VerificationProgress";
import Verdict from "@/app/verify/Verdict";

type Phase =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "result"; result: VerificationResult }
  | { kind: "notfound" }
  | { kind: "error"; message: string };

const STEP_MS = 320;
// Keep the check list on screen long enough to read, even when the API answers instantly.
const MIN_LOADING_MS = STEP_MS * CHECK_COUNT;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function VerifyClient() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [batchId, setBatchId] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "empty" });
  const [step, setStep] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const runToken = useRef(0);
  const lastQueried = useRef<string | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(ticker.current), []);

  const run = useCallback(
    async (rawId: string) => {
      const id = rawId.trim();
      if (!id) return;
      const token = ++runToken.current;
      lastQueried.current = id;

      setBatchId(id);
      setInput(id);
      setPhase({ kind: "loading" });
      setStep(0);
      clearInterval(ticker.current);
      ticker.current = setInterval(() => setStep((s) => Math.min(s + 1, CHECK_COUNT - 1)), STEP_MS);

      // Keep the URL shareable (/verify?batch=…) without adding history entries per check.
      router.replace(`/verify?batch=${encodeURIComponent(id)}`, { scroll: false });

      let next: Phase;
      try {
        const [result] = await Promise.all([verifyBatch(id), delay(MIN_LOADING_MS)]);
        next = { kind: "result", result };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          next = { kind: "notfound" };
        } else {
          next = { kind: "error", message: err instanceof Error ? err.message : "Verification could not be completed. Retry." };
        }
      }

      if (token !== runToken.current) return; // a newer check superseded this one
      clearInterval(ticker.current);
      setStep(CHECK_COUNT);
      setPhase(next);
    },
    [router]
  );

  // Run when the page is opened with ?batch=… (e.g. from the home page or a shared link).
  // Read the query on mount rather than via useSearchParams so the page shell can be prerendered.
  useEffect(() => {
    const queryBatch = new URLSearchParams(window.location.search).get("batch")?.trim();
    if (queryBatch && queryBatch !== lastQueried.current) {
      void run(queryBatch);
    }
  }, [run]);

  function tryAnother() {
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <main>
      <section className="page-intro grid-bg">
        <div className="container page-intro__inner">
          <div className="label">PUBLIC VERIFICATION</div>
          <h1 className="page-title">Verify a batch</h1>
          <p className="page-lede">
            Enter the batch ID from the label. Its lab results are compared against the sealed on-chain record.
          </p>
          <BatchIdForm
            value={input}
            onChange={setInput}
            onSubmit={run}
            inputRef={inputRef}
            disabled={phase.kind === "loading"}
            buttonLabel={
              <>
                <CheckIcon />
                Verify
              </>
            }
          />
          <div className="hint">
            <span>Example:</span>
            <button type="button" className="chip-btn" onClick={() => run("VA-2025-0001")}>
              VA-2025-0001
            </button>
          </div>
        </div>
      </section>

      <div className="container results" aria-live="polite" aria-busy={phase.kind === "loading"}>
        <div className="results__head">
          <h2 className="results__title">Result</h2>
          {phase.kind !== "empty" && batchId ? (
            <span className="mono faint" style={{ fontSize: 12, letterSpacing: "0.04em" }}>
              QUERY · {batchId}
            </span>
          ) : null}
        </div>

        {phase.kind === "empty" ? (
          <div className="empty-state">
            <span className="empty-state__icon">
              <SearchIcon />
            </span>
            <p>Enter a batch ID to retrieve its record.</p>
          </div>
        ) : null}

        {phase.kind === "loading" ? <VerificationProgress step={step} /> : null}

        {phase.kind === "notfound" ? <Verdict kind="notfound" batchId={batchId} onRetry={tryAnother} /> : null}

        {phase.kind === "error" ? (
          <div className="banner rise" role="alert">
            <AlertIcon className="banner__icon" />
            <div>
              <p className="banner__title">Verification incomplete</p>
              <p className="banner__msg">{phase.message}</p>
              <button type="button" className="btn btn--neutral" style={{ marginTop: 12 }} onClick={() => run(batchId)}>
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {phase.kind === "result" ? (
          <>
            <Verdict kind={phase.result.status} batchId={batchId} result={phase.result} />
            <VerificationDetails result={phase.result} />
          </>
        ) : null}
      </div>
    </main>
  );
}
