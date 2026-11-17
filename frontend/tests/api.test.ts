import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { verifyBatch } from "../src/lib/api";

describe("api client", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: true,
        batchId: "VA-2025-0001",
        offchainHash: "0xoff",
        onchainHash: "0xon",
        txHash: null,
        mismatchReason: null
      })
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchSpy.mockReset();
  });

  it("calls verify endpoint", async () => {
    const result = await verifyBatch("VA-2025-0001");
    expect(fetchSpy).toHaveBeenCalledWith("/batches/VA-2025-0001/verify", { method: "GET" });
    expect(result.verified).toBe(true);
  });

  it("encodes batch IDs in the URL path", async () => {
    await verifyBatch("A/B?x=1");
    expect(fetchSpy).toHaveBeenCalledWith("/batches/A%2FB%3Fx%3D1/verify", { method: "GET" });
  });
});
