"use client";

import { useEffect, useState } from "react";
import { ExternalIcon } from "@/components/icons";
import { ChainInfo, getChainInfo } from "@/lib/api";
import { addressUrl, truncateHash } from "@/lib/format";

/** Site footer: protocol name plus the live network and registry contract, read from the API. */
export default function AppFooter() {
  const [chain, setChain] = useState<ChainInfo | null>(null);

  useEffect(() => {
    getChainInfo()
      .then(setChain)
      .catch(() => setChain(null));
  }, []);

  const address = chain?.contractAddress ?? null;
  const explorer = addressUrl(address);

  return (
    <footer className="app-footer">
      <div className="container app-footer__inner">
        <span>SUPPLEMENT SUPPLY CHAIN VERIFICATION PROTOCOL</span>
        {chain ? (
          <div className="app-footer__meta">
            <span className="app-footer__item">
              <span className="app-footer__dot" aria-hidden="true" />
              NETWORK · <span className="app-footer__value">{chain.chainName.toUpperCase()}</span>
              {chain.mode === "mock" ? <span className="app-footer__value">(MOCK)</span> : null}
            </span>
            {address ? (
              explorer ? (
                <a className="app-footer__item app-footer__link" href={explorer} target="_blank" rel="noreferrer" title={address}>
                  REGISTRY · <span className="app-footer__value app-footer__address">{truncateHash(address)}</span>
                  <ExternalIcon size={12} weight={1.7} />
                </a>
              ) : (
                <span className="app-footer__item" title={address}>
                  REGISTRY · <span className="app-footer__value app-footer__address">{truncateHash(address)}</span>
                </span>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
