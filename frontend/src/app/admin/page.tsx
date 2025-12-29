"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Input from "@/components/Input";
import {
  createBatch,
  extractBatch,
  getAttestation,
  publishBatch,
  uploadDocument
} from "@/lib/api";

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [batchId, setBatchId] = useState("");
  const [productName, setProductName] = useState("");
  const [supplementType, setSupplementType] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [attestation, setAttestation] = useState<Record<string, unknown> | null>(null);

  async function handleCreateBatch() {
    setStatus(null);
    try {
      const payload = {
        batchId: batchId.trim(),
        productName,
        supplementType,
        manufacturer,
        productionDate,
        expiresDate: expiresDate || null
      };
      await createBatch(payload, apiKey);
      setStatus("Batch created.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create batch");
    }
  }

  async function handleUpload() {
    if (!file) return;
    setStatus(null);
    try {
      await uploadDocument(batchId.trim(), file, apiKey);
      setStatus("Document uploaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleExtract() {
    setStatus(null);
    try {
      await extractBatch(batchId.trim(), apiKey);
      setStatus("Extraction complete; batch marked READY.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Extraction failed");
    }
  }

  async function handleAttestation() {
    setStatus(null);
    try {
      const data = await getAttestation(batchId.trim(), apiKey);
      setAttestation(data);
      setStatus("Attestation loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load attestation");
    }
  }

  async function handlePublish() {
    setStatus(null);
    try {
      await publishBatch(batchId.trim(), apiKey);
      setStatus("Published to chain.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Publish failed");
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
            <Button onClick={handleCreateBatch} disabled={!apiKey || !batchId}>
              Create Batch
            </Button>
          </div>
        </Card>

        <Card title="Documents & Extraction">
          <div className="stack">
            <Field label="Upload Lab Report">
              <Input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </Field>
            <Button onClick={handleUpload} disabled={!apiKey || !batchId || !file}>
              Upload Document
            </Button>
            <Button variant="ghost" onClick={handleExtract} disabled={!apiKey || !batchId}>
              Trigger Extraction
            </Button>
          </div>
        </Card>

        <Card title="Attestation & Publish">
          <div className="stack">
            <Button onClick={handleAttestation} disabled={!apiKey || !batchId}>
              View Attestation
            </Button>
            <Button variant="ghost" onClick={handlePublish} disabled={!apiKey || !batchId}>
              Publish to Chain
            </Button>
          </div>
        </Card>

        <Card title="Latest Status">
          {status ? <p>{status}</p> : <p>Run an action to see status updates.</p>}
          {attestation ? <pre className="code-block">{JSON.stringify(attestation, null, 2)}</pre> : null}
        </Card>
      </div>
    </div>
  );
}
