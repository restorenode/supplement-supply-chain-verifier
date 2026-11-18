import { describe, expect, it } from "vitest";
import { ChainInfo } from "../src/lib/api";
import { explorerFor, networkLabel } from "../src/lib/chain";
import { addressUrl, truncateHash, txUrl } from "../src/lib/format";

const TX = `0x${"ab".repeat(32)}`;
const ADDRESS = `0x${"cd".repeat(20)}`;

const live: ChainInfo = {
  network: "base-sepolia",
  displayName: "Base Sepolia",
  chainId: 84532,
  testnet: true,
  mode: "real",
  contractAddress: ADDRESS,
  explorerUrl: "https://sepolia.basescan.org"
};

describe("explorer links", () => {
  it("builds transaction and address URLs from the explorer base", () => {
    expect(txUrl("https://sepolia.basescan.org/", TX)).toBe(`https://sepolia.basescan.org/tx/${TX}`);
    expect(addressUrl("https://sepolia.basescan.org", ADDRESS)).toBe(`https://sepolia.basescan.org/address/${ADDRESS}`);
  });

  it("returns nothing without an explorer or for malformed values", () => {
    expect(txUrl(null, TX)).toBeUndefined();
    expect(txUrl("https://sepolia.basescan.org", "0x1234")).toBeUndefined();
    expect(addressUrl("https://sepolia.basescan.org", "not-an-address")).toBeUndefined();
  });

  it("only links records sealed on the live, non-mock network", () => {
    expect(explorerFor(live, "base-sepolia")).toBe("https://sepolia.basescan.org");
    expect(explorerFor(live, "initia-evm")).toBeNull();
    expect(explorerFor({ ...live, mode: "mock", explorerUrl: null }, "base-sepolia")).toBeNull();
    expect(explorerFor(null, "base-sepolia")).toBeNull();
  });
});

describe("labels", () => {
  it("uses the display name for the active network and title-cases others", () => {
    expect(networkLabel(live, "base-sepolia")).toBe("Base Sepolia");
    expect(networkLabel(live, "initia-evm")).toBe("Initia Evm");
    expect(networkLabel(live, null)).toBeNull();
  });

  it("truncates hashes to 6 + 4 characters", () => {
    expect(truncateHash(TX)).toBe("0xabab…abab");
    expect(truncateHash("0x1234")).toBe("0x1234");
  });
});
