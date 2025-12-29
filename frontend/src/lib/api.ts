export type BatchCreate = {
  batchId: string;
  productName: string;
  supplementType: string;
  manufacturer: string;
  productionDate: string;
  expiresDate?: string | null;
};

export type Batch = BatchCreate & {
  status: "DRAFT" | "READY" | "PUBLISHED";
};

export type ExtractionResponse = {
  batchId: string;
  extractedFields: {
    labName: string | null;
    reportDate: string | null;
    productOrSampleName: string | null;
    lotOrBatchInReport: string | null;
    potency: {
      name: string | null;
      amount: string | null;
      unit: string | null;
    } | null;
    analytes: Array<{
      name: string | null;
      result: string | null;
      unit: string | null;
      limit: string | null;
      status: "PASS" | "FAIL" | "UNKNOWN";
    }>;
    contaminants: Array<{
      name: string | null;
      result: string | null;
      unit: string | null;
      limit: string | null;
      status: "PASS" | "FAIL" | "UNKNOWN";
    }>;
    methods: string[];
    notes: string | null;
    confidence: number;
  };
  extractedAt: string;
  modelInfo: {
    modelName: string;
    version: string;
  };
};

export type Attestation = {
  batchId: string;
  canonicalJson: Record<string, unknown>;
  canonicalJsonHash: string;
  createdAt: string;
  published: boolean;
  chain: string;
  txHash: string | null;
  publisherAddress: string | null;
  publishedAt: string | null;
};

export type VerificationResult = {
  verified: boolean;
  batchId: string;
  offchainHash: string;
  onchainHash: string | null;
  txHash: string | null;
  mismatchReason: string | null;
};

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

function buildUrl(path: string) {
  if (!BASE_URL) return path;
  return `${BASE_URL}${path}`;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), options);
  if (!response.ok) {
    let detail = "Request failed";
    try {
      const body = await response.json();
      if (body?.error?.message) {
        detail = body.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function createBatch(payload: BatchCreate, apiKey: string) {
  return request<Batch>("/batches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify(payload)
  });
}

export function uploadDocument(batchId: string, file: File, apiKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  return request<Record<string, unknown>>(`/batches/${batchId}/documents`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey
    },
    body: formData
  });
}

export function extractBatch(batchId: string, apiKey: string) {
  return request<ExtractionResponse>(`/batches/${batchId}/extract`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey
    }
  });
}

export function getAttestation(batchId: string, apiKey: string) {
  return request<Attestation>(`/batches/${batchId}/attestation`, {
    headers: {
      "X-API-Key": apiKey
    }
  });
}

export function publishBatch(batchId: string, apiKey: string) {
  return request<Record<string, unknown>>(`/batches/${batchId}/publish`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey
    }
  });
}

export function verifyBatch(batchId: string) {
  return request<VerificationResult>(`/batches/${batchId}/verify`, {
    method: "GET"
  });
}
