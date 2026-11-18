"use client";

import AnalyteStatusCell from "@/components/AnalyteStatus";
import Hash from "@/components/Hash";
import { AlertIcon, ExternalIcon } from "@/components/icons";
import { Analyte, VerificationResult } from "@/lib/api";
import { explorerFor, networkLabel, useChainInfo } from "@/lib/chain";
import { formatDate, formatUtc, txUrl } from "@/lib/format";

function labRows(result: VerificationResult): Analyte[] {
  if (!result.labReport) return [];
  return [...result.labReport.analytes, ...result.labReport.contaminants];
}

function withUnit(value: string | null, unit: string | null) {
  if (!value) return "—";
  return unit && !value.includes(unit) ? `${value} ${unit}` : value;
}

/** Character-level comparison in 16 groups of 4 hex chars. */
function HashComparison({ offchain, onchain }: { offchain: string; onchain: string }) {
  const a = offchain.replace(/^0x/, "");
  const b = onchain.replace(/^0x/, "");
  const groups = Array.from({ length: Math.ceil(Math.max(a.length, b.length) / 4) }, (_, i) => ({
    off: a.slice(i * 4, i * 4 + 4),
    on: b.slice(i * 4, i * 4 + 4)
  }));
  let diffChars = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diffChars++;
  const total = Math.max(a.length, b.length);

  return (
    <div className="proof__section">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span className="label">Character comparison</span>
        <span className="mono muted" style={{ fontSize: 12 }}>
          {diffChars === 0 ? `${total} / ${total} characters match` : `Differs at ${diffChars} of ${total} characters`}
        </span>
      </div>
      <div className="diff">
        <span className="diff__label">OFF</span>
        <div className="diff__row">
          {groups.map((g, i) => (
            <span key={i} className="diff__g">
              {g.off}
            </span>
          ))}
        </div>
        <span className="diff__label">ON</span>
        <div className="diff__row">
          {groups.map((g, i) => (
            <span key={i} className={`diff__g ${g.on === g.off ? "diff__g--same" : "diff__g--diff"}`}>
              {g.on}
              {g.on === g.off ? null : <span className="sr-only"> (differs)</span>}
            </span>
          ))}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13, maxWidth: 720, textWrap: "pretty" }}>
        A fingerprint is 64 hexadecimal characters. Altering any single value in the record changes it entirely.
      </p>
    </div>
  );
}

export default function VerificationDetails({ result }: { result: VerificationResult }) {
  const { product, status } = result;
  const rows = labRows(result);
  const lab = result.labReport;
  const chainInfo = useChainInfo();
  const explorer = txUrl(explorerFor(chainInfo, result.chain), result.txHash);
  const showLabs = status === "verified" && !!lab;

  return (
    <>
      <div className="details rise">
        <section className="card" aria-labelledby="product-title">
          <header className="card__header">
            <h4 id="product-title" className="card__title">
              Product
            </h4>
            {status !== "verified" ? (
              <span
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10.5,
                  letterSpacing: "0.1em",
                  color: status === "mismatch" ? "var(--bad)" : "var(--warn)"
                }}
              >
                <AlertIcon size={11} />
                UNCONFIRMED
              </span>
            ) : null}
          </header>
          <dl className="dl">
            <div className="dl__row">
              <dt>Product Name</dt>
              <dd>{product.productName}</dd>
            </div>
            <div className="dl__row">
              <dt>Manufacturer</dt>
              <dd>{product.manufacturer}</dd>
            </div>
            <div className="dl__row">
              <dt>Supplement Type</dt>
              <dd>{product.supplementType}</dd>
            </div>
            <div className="dl__row">
              <dt>Production Date</dt>
              <dd>{formatDate(product.productionDate)}</dd>
            </div>
            <div className="dl__row">
              <dt>Expires Date</dt>
              <dd>{formatDate(product.expiresDate)}</dd>
            </div>
          </dl>
        </section>

        {showLabs ? (
          <section className="card" aria-labelledby="labs-title">
            <header className="card__header">
              <h4 id="labs-title" className="card__title">
                Lab results
              </h4>
              <span className="label" style={{ fontSize: 10.5 }}>
                CERTIFICATE OF ANALYSIS
              </span>
            </header>
            {rows.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Analyte</th>
                      <th scope="col">Result</th>
                      <th scope="col">Limit</th>
                      <th scope="col" style={{ textAlign: "right" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.name}-${index}`}>
                        <td style={{ fontWeight: 500 }}>{row.name ?? "Unnamed analyte"}</td>
                        <td>{withUnit(row.result, row.unit)}</td>
                        <td className="muted">{row.limit ?? "—"}</td>
                        <td style={{ textAlign: "right" }}>
                          <AnalyteStatusCell status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="card__body muted" style={{ fontSize: 14 }}>
                No individual results are listed in this certificate.
              </p>
            )}
            {lab?.labName || lab?.reportDate ? (
              <p className="card__foot">
                SOURCE · {[lab.labName, lab.reportDate ? `REPORT ${formatDate(lab.reportDate)}` : null]
                  .filter(Boolean)
                  .join(" · ")
                  .toUpperCase()}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      <section className="card rise" aria-labelledby="proof-title">
        <header className="card__header">
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h4 id="proof-title" className="card__title">
              Proof
            </h4>
            <span className="faint" style={{ fontSize: 13 }}>
              Technical record
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="tag">KECCAK-256</span>
            <span className="tag">OFF-CHAIN ⇄ ON-CHAIN</span>
          </div>
        </header>

        <div className="proof__hashes">
          <div className="proof__col">
            <span className="label">Off-chain fingerprint · Keccak-256</span>
            <span className="proof__sub">Fingerprint of the lab results on file</span>
            <Hash value={result.offchainHash} placeholder="Not yet extracted" label="computed fingerprint" />
          </div>
          <div className="proof__cmp">
            {status === "verified" ? (
              <span className="cmp cmp--ok">
                <span className="cmp__sym" aria-hidden="true">
                  =
                </span>
                Fingerprints match
              </span>
            ) : status === "mismatch" ? (
              <span className="cmp cmp--bad">
                <span className="cmp__sym" aria-hidden="true">
                  ≠
                </span>
                Fingerprints differ
              </span>
            ) : (
              <span className="cmp cmp--warn">
                <span className="cmp__sym" aria-hidden="true">
                  ?
                </span>
                Nothing to compare
              </span>
            )}
          </div>
          <div className="proof__col">
            <span className="label">On-chain fingerprint · Keccak-256</span>
            <span className="proof__sub">Fingerprint recorded on-chain at publication</span>
            <Hash value={result.onchainHash} placeholder="Not sealed" label="sealed fingerprint" />
          </div>
        </div>

        {result.offchainHash && result.onchainHash ? (
          <HashComparison offchain={result.offchainHash} onchain={result.onchainHash} />
        ) : null}

        <div className="proof__tx">
          <div className="proof__col">
            <span className="label">Transaction</span>
            <Hash value={result.txHash} href={explorer} placeholder="Not sealed" label="transaction hash" />
          </div>
          {result.txHash ? (
            <div className="proof__col" style={{ gap: 4, paddingBottom: 2 }}>
              <span className="mono muted" style={{ fontSize: 12 }}>
                {[networkLabel(chainInfo, result.chain)?.toUpperCase(), result.publishedAt ? formatUtc(result.publishedAt) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {explorer ? (
                <a href={explorer} target="_blank" rel="noreferrer" className="ext-link">
                  View on block explorer
                  <ExternalIcon size={13} />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
