import type { CheckResult } from "@/lib/classify";
import type { UIStrings } from "@/lib/i18n";

export default function VerdictCard({
  result,
  message,
  s,
}: {
  result: CheckResult;
  message: string;
  s: UIStrings;
}) {
  const verdictLabel =
    result.verdict === "likely_scam"
      ? s.verdictScam
      : result.verdict === "be_careful"
        ? s.verdictCareful
        : s.verdictNone;
  const gloss =
    result.verdict === "likely_scam"
      ? s.glossScam
      : result.verdict === "be_careful"
        ? s.glossCareful
        : s.glossNone;

  const urls = result.entities?.urls ?? [];
  const vpas = result.entities?.upi_ids ?? [];
  const brand = result.entities?.impersonated_brand;

  return (
    <main>
      <section className="stamp" data-verdict={result.verdict}>
        <span className="stamp__label">{s.verdictLabel}</span>
        <strong className="stamp__verdict">{verdictLabel}</strong>
        <p className="stamp__gloss">{gloss}</p>
      </section>

      <p className="reason">{result.reason}</p>

      <div className="action">
        <span className="action__label">{s.nextStepsLabel}</span>
        {result.action}
      </div>

      {(urls.length > 0 || vpas.length > 0 || brand) && (
        <ul className="evidence">
          {brand && (
            <li>
              <b>{s.claimedSender}</b>
              <br />
              {brand}
            </li>
          )}
          {urls.map((u) => (
            <li key={u}>
              <b>{s.linkLabel}</b>
              <br />
              {u}
            </li>
          ))}
          {vpas.map((v) => (
            <li key={v}>
              <b>{s.upiLabel}</b>
              <br />
              {v}
            </li>
          ))}
        </ul>
      )}

      {result.verdict !== "no_signals" && (
        <p className="report">
          {s.reportPrefix}
          <a href={`tel:${s.reportCall}`}>{s.reportCall}</a>
          {s.reportOr}
          <a href={`https://${s.reportPortal}`} rel="noopener noreferrer" target="_blank">
            {s.reportPortal}
          </a>
          {s.reportSuffix}
        </p>
      )}

      <hr className="hairline" />

      <p className="eyebrow" style={{ display: "block", marginBottom: "0.4rem" }}>
        {s.checkedMessage}
      </p>
      <div className="quoted">{message}</div>

      <p style={{ marginTop: "1.5rem" }}>
        <a className="btn btn--ghost" href="/" style={{ textDecoration: "none" }}>
          {s.checkAnother}
        </a>
      </p>

      <p className="note" style={{ marginTop: "1.5rem" }}>
        {result.cached ? s.cacheHit : s.freshCheck} · {result.latencyMs}ms
        {result.downgradedBy ? ` · rule: ${result.downgradedBy}` : ""}
        {result.hardSignals.length ? ` · signals: ${result.hardSignals.join(", ")}` : ""}
      </p>
    </main>
  );
}
