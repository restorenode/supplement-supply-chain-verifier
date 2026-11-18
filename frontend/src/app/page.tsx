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
              KECCAK-256 · ON-CHAIN ATTESTATION
            </div>
            <h1 className="hero__title">Check that a supplement&apos;s lab report is real.</h1>
            <p className="hero__lede">
              Trace, verify, and publish supplement batch attestations with a tamper-evident chain.
            </p>
            <HomeSearch />
            <p className="hint">
              Find the batch ID on the bottle label, near the expiry date. Example:{" "}
              <span className="mono muted">VA-2025-0001</span>
            </p>
            <div className="hero__publisher">
              <span>Publishing lab reports for your batches?</span>
              <Link href="/admin" className="btn btn--neutral">
                Publisher admin
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>

          <aside className="sample" aria-label="Example of a verification result">
            <div className="sample__head">
              <span>SAMPLE RESULT</span>
              <span>VA-2025-0001</span>
            </div>
            <div className="sample__verdict">
              <Seal kind="verified" small />
              <div style={{ minWidth: 0 }}>
                <span className="sample__status">
                  <CheckIcon size={11} weight={2.4} />
                  VERIFIED
                </span>
                <p className="sample__headline">This lab data is authentic.</p>
              </div>
            </div>
            <dl className="sample__list">
              <div>
                <dt>Product</dt>
                <dd>Magnesium Glycinate 400 mg</dd>
              </div>
              <div>
                <dt>Lab results</dt>
                <dd>6 of 6 pass</dd>
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
            How it works
          </h2>
          <span className="label">3 STEPS · NO ACCOUNT NEEDED TO VERIFY</span>
        </div>
        <ol className="steps3">
          <li>
            <div className="steps3__rule">
              <span className="steps3__num">01</span>
              <span className="steps3__line" />
              <span className="label" style={{ fontSize: 10.5 }}>
                OFF-CHAIN
              </span>
            </div>
            <h3>Lab report</h3>
            <p>The manufacturer uploads the batch&apos;s Certificate of Analysis. Key results are extracted from the PDF.</p>
          </li>
          <li>
            <div className="steps3__rule">
              <span className="steps3__num">02</span>
              <span className="steps3__line" />
              <span className="label" style={{ fontSize: 10.5 }}>
                HASH → ON-CHAIN
              </span>
            </div>
            <h3>Hashed &amp; attested on-chain</h3>
            <p>The extracted data is hashed, and that hash is published to a public blockchain where it can&apos;t be edited.</p>
          </li>
          <li>
            <div className="steps3__rule">
              <span className="steps3__num">03</span>
              <span className="steps3__line" />
              <span className="label" style={{ fontSize: 10.5 }}>
                PUBLIC
              </span>
            </div>
            <h3>Anyone can verify</h3>
            <p>Enter a batch ID. We recompute the hash from the stored data and compare it with the one on-chain.</p>
          </li>
        </ol>
      </section>

      <section className="container section section--last" aria-labelledby="chain">
        <div className="chain-split">
          <div className="chain-split__intro">
            <h2 id="chain" className="section__title" style={{ marginBottom: 10 }}>
              What goes on-chain
            </h2>
            <p className="muted" style={{ fontSize: 14 }}>
              Only fingerprints. A hash reveals nothing about the document it came from, but any change to the document
              changes the hash.
            </p>
          </div>
          <div className="chain-split__cards">
            <div className="where">
              <div className="where__head">
                <span className="tag">OFF-CHAIN</span>
                <span>Stored by the publisher</span>
              </div>
              <ul>
                <li>Full lab report PDF</li>
                <li>Extracted lab results</li>
                <li>Product and batch details</li>
              </ul>
            </div>
            <div className="where where--on">
              <div className="where__head">
                <span className="tag">ON-CHAIN</span>
                <span>Public and permanent</span>
              </div>
              <ul>
                <li>Keccak-256 hash of the attestation</li>
                <li>Hashed batch ID reference</li>
                <li>Transaction and timestamp</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
