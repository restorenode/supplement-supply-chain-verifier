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

export type AnalyteStatus = "PASS" | "FAIL" | "UNKNOWN";

export type Analyte = {
  name: string | null;
  result: string | null;
  unit: string | null;
  limit: string | null;
  status: AnalyteStatus;
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
    analytes: Analyte[];
    contaminants: Analyte[];
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

export type DocumentInfo = {
  documentId: string;
  batchId: string;
  filename: string;
  contentType: string;
  uploadedAt: string;
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

export type PublishResult = {
  batchId: string;
  txHash: string;
  blockNumber: number;
  publishedAt: string;
};

export type VerificationStatus = "verified" | "mismatch" | "unpublished";

export type VerificationResult = {
  verified: boolean;
  status: VerificationStatus;
  batchId: string;
  offchainHash: string | null;
  onchainHash: string | null;
  txHash: string | null;
  chain: string | null;
  publishedAt: string | null;
  mismatchReason: string | null;
  product: {
    productName: string;
    manufacturer: string;
    supplementType: string;
    productionDate: string;
    expiresDate: string | null;
  };
  labReport: {
    labName: string | null;
    reportDate: string | null;
    analytes: Analyte[];
    contaminants: Analyte[];
    methods: string[];
  } | null;
};

/** Error thrown for non-2xx responses; carries the HTTP status and the API's error code. */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

function batchPath(batchId: string, suffix = "") {
  return `/batches/${encodeURIComponent(batchId)}${suffix}`;
}

function buildUrl(path: string) {
  if (!BASE_URL) return path;
  return `${BASE_URL}${path}`;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), options);
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection and try again.", 0, "NETWORK_ERROR");
  }
  if (!response.ok) {
    let detail = "Request failed";
    let code: string | undefined;
    try {
      const body = await response.json();
      if (body?.error?.message) {
        detail = body.error.message;
      }
      code = body?.error?.code;
    } catch {
      // ignore
    }
    throw new ApiError(detail, response.status, code);
  }
  return response.json() as Promise<T>;
}

export function checkApiKey(apiKey: string) {
  return request<{ ok: boolean }>("/auth/check", {
    method: "GET",
    headers: {
      "X-API-Key": apiKey
    }
  });
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
  return request<DocumentInfo>(batchPath(batchId, "/documents"), {
    method: "POST",
    headers: {
      "X-API-Key": apiKey
    },
    body: formData
  });
}

export function extractBatch(batchId: string, apiKey: string) {
  return request<ExtractionResponse>(batchPath(batchId, "/extract"), {
    method: "POST",
    headers: {
      "X-API-Key": apiKey
    }
  });
}

export function getAttestation(batchId: string, apiKey: string) {
  return request<Attestation>(batchPath(batchId, "/attestation"), {
    headers: {
      "X-API-Key": apiKey
    }
  });
}

export function publishBatch(batchId: string, apiKey: string) {
  return request<PublishResult>(batchPath(batchId, "/publish"), {
    method: "POST",
    headers: {
      "X-API-Key": apiKey
    }
  });
}

export function verifyBatch(batchId: string) {
  return request<VerificationResult>(batchPath(batchId, "/verify"), {
    method: "GET"
  });
}
