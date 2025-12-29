"use client";

import { useMemo, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Input from "@/components/Input";
import StatusStepper from "@/components/StatusStepper";
import {
  Attestation,
  createBatch,
  extractBatch,
  getAttestation,
  publishBatch,
  uploadDocument
} from "@/lib/api";

type StepStatus = "idle" | "pending" | "success" | "error";
type StepKey = "created" | "uploaded" | "extracted" | "attested" | "published";
type ActionKey = "create" | "upload" | "extract" | "attestation" | "publish";
type ActionMessage = { type: "success" | "error"; text: string };
type ActivityEntry = { message: string; time: string; type: "success" | "error" | "info" };

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [batchId, setBatchId] = useState("");
  const [productName, setProductName] = useState("");
  const [supplementType, setSupplementType] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [stepStates, setStepStates] = useState<Record<StepKey, StepStatus>>({
    created: "idle",
    uploaded: "idle",
    extracted: "idle",
    attested: "idle",
    published: "idle"
  });
  const [actionMessages, setActionMessages] = useState<Record<ActionKey, ActionMessage | null>>({
    create: null,
    upload: null,
    extract: null,
    attestation: null,
    publish: null
  });
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

  const trimmedBatchId = batchId.trim();

  const hasAccess = !!apiKey && !!trimmedBatchId;
  const canCreate =
    hasAccess &&
    !!productName.trim() &&
    !!supplementType.trim() &&
    !!manufacturer.trim() &&
    !!productionDate.trim() &&
    stepStates.created !== "pending";
  const canUpload = hasAccess && stepStates.created === "success" && !!file && stepStates.uploaded !== "pending";
  const canExtract = hasAccess && stepStates.uploaded === "success" && stepStates.extracted !== "pending";
  const canAttest = hasAccess && stepStates.extracted === "success" && stepStates.attested !== "pending";
  const canPublish =
    hasAccess && stepStates.attested === "success" && stepStates.published !== "pending" && stepStates.published !== "success";

  const steps = useMemo(
    () => [
      {
        key: "created",
        label: "Batch created",
        status: stepStates.created,
        detail: actionMessages.create?.type === "success" ? actionMessages.create.text : undefined
      },
      {
        key: "uploaded",
        label: "PDF uploaded",
        status: stepStates.uploaded,
        detail: actionMessages.upload?.type === "success" ? actionMessages.upload.text : undefined
      },
      {
        key: "extracted",
        label: "Extraction complete",
        status: stepStates.extracted,
        detail: actionMessages.extract?.type === "success" ? actionMessages.extract.text : undefined
      },
      {
        key: "attested",
        label: "Attestation ready",
        status: stepStates.attested,
        detail: attestation?.canonicalJsonHash ? `Hash: ${attestation.canonicalJsonHash}` : undefined
      },
      {
        key: "published",
        label: "Published on-chain",
        status: stepStates.published,
        detail: actionMessages.publish?.type === "success" ? actionMessages.publish.text : undefined
      }
    ],
    [actionMessages, attestation, stepStates]
  );

  function pushActivity(message: string, type: ActivityEntry["type"] = "info") {
    const time = new Date().toLocaleTimeString();
    setActivityLog((prev) => [{ message, time, type }, ...prev].slice(0, 10));
  }

  function updateStep(key: StepKey, status: StepStatus) {
    setStepStates((prev) => ({ ...prev, [key]: status }));
  }

  function setMessage(key: ActionKey, type: ActionMessage["type"], text: string) {
    setActionMessages((prev) => ({ ...prev, [key]: { type, text } }));
  }

  async function handleCreateBatch() {
    updateStep("created", "pending");
    try {
      const payload = {
        batchId: trimmedBatchId,
        productName,
        supplementType,
        manufacturer,
        productionDate,
        expiresDate: expiresDate || null
      };
      await createBatch(payload, apiKey);
      updateStep("created", "success");
      setMessage("create", "success", "Batch created.");
      pushActivity("Batch created", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create batch";
      updateStep("created", "error");
      setMessage("create", "error", message);
      pushActivity(`Create failed: ${message}`, "error");
    }
  }

  async function handleUpload() {
    if (!file) return;
    updateStep("uploaded", "pending");
    try {
      await uploadDocument(trimmedBatchId, file, apiKey);
      updateStep("uploaded", "success");
      setMessage("upload", "success", "Document uploaded.");
      pushActivity("Uploaded PDF", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      updateStep("uploaded", "error");
      setMessage("upload", "error", message);
      pushActivity(`Upload failed: ${message}`, "error");
    }
  }

  async function handleExtract() {
    updateStep("extracted", "pending");
    try {
      await extractBatch(trimmedBatchId, apiKey);
      updateStep("extracted", "success");
      setMessage("extract", "success", "Extraction complete.");
      pushActivity("Extraction succeeded", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      updateStep("extracted", "error");
      setMessage("extract", "error", message);
      pushActivity(`Extraction failed: ${message}`, "error");
    }
  }

  async function handleAttestation() {
    updateStep("attested", "pending");
    try {
      const data = await getAttestation(trimmedBatchId, apiKey);
      setAttestation(data);
      updateStep("attested", "success");
      setMessage("attestation", "success", "Attestation ready.");
      pushActivity("Attestation ready", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load attestation";
      updateStep("attested", "error");
      setMessage("attestation", "error", message);
      pushActivity(`Attestation failed: ${message}`, "error");
    }
  }

  async function handlePublish() {
    updateStep("published", "pending");
    try {
      await publishBatch(trimmedBatchId, apiKey);
      updateStep("published", "success");
      setMessage("publish", "success", "Published on-chain.");
      pushActivity("Published on-chain", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      updateStep("published", "error");
      setMessage("publish", "error", message);
      pushActivity(`Publish failed: ${message}`, "error");
    }
  }

  return (
    <div className="grid">
      <Card title="Admin Access">
        <Field label="API Key" hint="Stored only in memory.">
          <Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
        </Field>
      </Card>

      <div className="grid grid-2">
        <Card title="Create Batch">
          <div className="stack">
            <Field label="Batch ID">
              <Input value={batchId} onChange={(event) => setBatchId(event.target.value)} />
            </Field>
            <Field label="Product Name">
              <Input value={productName} onChange={(event) => setProductName(event.target.value)} />
            </Field>
            <Field label="Supplement Type">
              <Input value={supplementType} onChange={(event) => setSupplementType(event.target.value)} />
            </Field>
            <Field label="Manufacturer">
              <Input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} />
            </Field>
            <Field label="Production Date">
              <Input type="date" value={productionDate} onChange={(event) => setProductionDate(event.target.value)} />
            </Field>
            <Field label="Expires Date">
              <Input type="date" value={expiresDate} onChange={(event) => setExpiresDate(event.target.value)} />
            </Field>
            <Button onClick={handleCreateBatch} disabled={!canCreate}>
              Create Batch
            </Button>
            {actionMessages.create ? (
              <p className={`message ${actionMessages.create.type}`}>{actionMessages.create.text}</p>
            ) : null}
          </div>
        </Card>

        <Card title="Documents & Extraction">
          <div className="stack">
            <Field label="Upload Lab Report">
              <Input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </Field>
            <Button onClick={handleUpload} disabled={!canUpload}>
              Upload Document
            </Button>
            {actionMessages.upload ? (
              <p className={`message ${actionMessages.upload.type}`}>{actionMessages.upload.text}</p>
            ) : null}
            <Button variant="ghost" onClick={handleExtract} disabled={!canExtract}>
              Trigger Extraction
            </Button>
            {actionMessages.extract ? (
              <p className={`message ${actionMessages.extract.type}`}>{actionMessages.extract.text}</p>
            ) : null}
          </div>
        </Card>

        <Card title="Attestation & Publish">
          <div className="stack">
            <Button onClick={handleAttestation} disabled={!canAttest}>
              View Attestation
            </Button>
            {actionMessages.attestation ? (
              <p className={`message ${actionMessages.attestation.type}`}>{actionMessages.attestation.text}</p>
            ) : null}
            <Button variant="ghost" onClick={handlePublish} disabled={!canPublish}>
              Publish to Chain
            </Button>
            {actionMessages.publish ? (
              <p className={`message ${actionMessages.publish.type}`}>{actionMessages.publish.text}</p>
            ) : null}
          </div>
        </Card>

        <Card title="Pipeline Status">
          <StatusStepper steps={steps} />
        </Card>

        <Card title="Activity Log">
          {activityLog.length ? (
            <div className="activity-log">
              {activityLog.map((entry, index) => (
                <div className={`activity-item ${entry.type}`} key={`${entry.time}-${index}`}>
                  <span>{entry.message}</span>
                  <span className="activity-time">{entry.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No activity yet.</p>
          )}
        </Card>

        <Card title="Attestation Payload">
          {attestation ? <pre className="code-block">{JSON.stringify(attestation, null, 2)}</pre> : <p>No attestation yet.</p>}
        </Card>
      </div>
    </div>
  );
}
