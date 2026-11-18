import Link from "next/link";
import HomeSearch from "@/app/HomeSearch";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import Seal from "@/components/Seal";

export default function HomePage() {
  return (
    <main>
      <section className="hero grid-bg">
        <div className="container hero__inner">
          <div className="hero__copy">
            <div className="pill">
              <span className="pill__dot" />
              LAB RESULTS · SEALED ON-CHAIN
            </div>
            <h1 className="hero__title">Lab results, sealed at the source.</h1>
            <p className="hero__lede">
              Each batch&apos;s Certificate of Analysis is sealed on-chain at publication. Any alteration, however small, is detectable.
            </p>
            <HomeSearch />
            <p className="hint">
              Printed on the label, near the expiry date. Example:{" "}
              <span className="mono muted">VA-2025-0001</span>
            </p>
            <div className="hero__publisher">
              <span>Manufacturers publish their Certificates of Analysis here.</span>
              <Link href="/admin" className="btn btn--neutral">
                Publisher console
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>

          <aside className="sample" aria-label="Example verification result">
            <div className="sample__head">
              <span>EXAMPLE RESULT</span>
              <span>VA-2025-0001</span>
            </div>
            <div className="sample__verdict">
              <Seal kind="verified" small />
              <div style={{ minWidth: 0 }}>
                <span className="sample__status">
                  <CheckIcon size={11} weight={2.4} />
                  VERIFIED
                </span>
                <p className="sample__headline">Record intact.</p>
              </div>
            </div>
            <dl className="sample__list">
              <div>
                <dt>Product</dt>
                <dd>Magnesium Glycinate 400 mg</dd>
              </div>
              <div>
                <dt>Lab results</dt>
                <dd>6 of 6 within specification</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>Jan 12, 2027</dd>
              </div>
            </dl>
            <div className="sample__hashes">
              <span className="label" style={{ fontSize: 10 }}>
                OFF
              </span>
              <span>0x786d…37fd</span>
              <span className="sample__match">= Match</span>
              <span className="label" style={{ fontSize: 10 }}>
                ON
              </span>
              <span>0x786d…37fd</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="container section" aria-labelledby="how">
        <div className="section__head">
          <h2 id="how" className="section__title">
            Method
          </h2>
          <span className="label">THREE STEPS · OPEN TO ANYONE</span>
        </div>
        <ol className="steps3">
          <li>
            <div className="steps3__rule">
              <span className="steps3__num">01</span>
              <span className="steps3__line" />
              <span className="label" style={{ fontSize: 10.5 }}>
                LABORATORY
              </span>
            </div>
            <h3>Analysis</h3>
            <p>The manufacturer submits the batch&apos;s Certificate of Analysis from its testing laboratory. The results are extracted from the document.</p>
          </li>
          <li>
            <div className="steps3__rule">
              <span className="steps3__num">02</span>
              <span className="steps3__line" />
              <span className="label" style={{ fontSize: 10.5 }}>
                BLOCKCHAIN
              </span>
            </div>
            <h3>Seal</h3>
            <p>The results are reduced to a cryptographic fingerprint and recorded on a public blockchain. The record cannot be edited.</p>
          </li>
          <li>
            <div className="steps3__rule">
              <span className="steps3__num">03</span>
              <span className="steps3__line" />
              <span className="label" style={{ fontSize: 10.5 }}>
                PUBLIC
              </span>
            </div>
            <h3>Verification</h3>
            <p>Anyone can enter a batch ID. The fingerprint is recomputed from the record and compared with the seal.</p>
          </li>
        </ol>
      </section>

      <section className="container section section--last" aria-labelledby="chain">
        <div className="chain-split">
          <div className="chain-split__intro">
            <h2 id="chain" className="section__title" style={{ marginBottom: 10 }}>
              Data custody
            </h2>
            <p className="muted" style={{ fontSize: 14 }}>
              Only fingerprints are recorded on-chain. A fingerprint reveals nothing about the record it describes. Change
              a single value and it no longer matches.
            </p>
          </div>
          <div className="chain-split__cards">
            <div className="where">
              <div className="where__head">
                <span className="tag">OFF-CHAIN</span>
                <span>Held by the manufacturer</span>
              </div>
              <ul>
                <li>Certificate of Analysis (PDF)</li>
                <li>Extracted test results</li>
                <li>Product and batch details</li>
              </ul>
            </div>
            <div className="where where--on">
              <div className="where__head">
                <span className="tag">ON-CHAIN</span>
                <span>Public. Permanent.</span>
              </div>
              <ul>
                <li>Fingerprint of the record</li>
                <li>Hashed batch reference</li>
                <li>Time of publication</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
