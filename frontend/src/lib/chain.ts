"use client";

import { useEffect, useState } from "react";
import { ChainInfo, getChainInfo } from "@/lib/api";

// One request per page load, shared by the footer, Verify and the publisher console.
let cached: Promise<ChainInfo | null> | null = null;

function loadChainInfo(): Promise<ChainInfo | null> {
  if (!cached) {
    cached = getChainInfo().catch(() => {
      cached = null; // retry on the next mount if the API was unreachable
      return null;
    });
  }
  return cached;
}

export function useChainInfo(): ChainInfo | null {
  const [info, setInfo] = useState<ChainInfo | null>(null);
  useEffect(() => {
    let active = true;
    loadChainInfo().then((value) => {
      if (active) setInfo(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return info;
}

/** Human label for a stored network key, e.g. "base-sepolia" -> "Base Sepolia" when it is the active network. */
export function networkLabel(info: ChainInfo | null, key: string | null | undefined): string | null {
  if (!key) return null;
  if (info && info.network === key) return info.displayName;
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Explorer base to link a record sealed on `key`, only when it matches the live (non-mock) network. */
export function explorerFor(info: ChainInfo | null, key: string | null | undefined): string | null {
  if (!info || info.mode === "mock" || !info.explorerUrl) return null;
  return !key || key === info.network ? info.explorerUrl : null;
}
