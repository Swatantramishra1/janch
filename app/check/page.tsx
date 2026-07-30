import VerdictCard from "@/components/VerdictCard";
import { check, ClassifyError } from "@/lib/classify";
import { stripShareChrome } from "@/lib/normalize";
import { readLang } from "@/lib/language";
import { strings } from "@/lib/i18n";

// Android's share sheet lands here with ?text=… (see share_target in the manifest).
// Nothing is cacheable at the page level: every arrival is a different message.
export const dynamic = "force-dynamic";

type Search = { text?: string; title?: string; url?: string };

export default async function CheckPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const lang = await readLang();
  const s = strings(lang);
  // Some apps share only a URL, others the text plus the URL. Join what arrived.
  const shared = [params.text, params.url].filter(Boolean).join("\n").trim();

  if (!shared) {
    return (
      <main>
        <div className="error">{s.noMessage}</div>
        <p style={{ marginTop: "1.5rem" }}>
          <a className="btn btn--ghost" href="/" style={{ textDecoration: "none" }}>
            {s.pasteInstead}
          </a>
        </p>
      </main>
    );
  }

  try {
    const result = await check(shared, lang);
    return <VerdictCard result={result} message={stripShareChrome(shared)} s={s} />;
  } catch (err) {
    const known = err instanceof ClassifyError;
    return (
      <main>
        <div className="error">
          {known ? s.errorKnown : s.errorUnknown}
          <p className="note" style={{ marginTop: "0.75rem" }}>
            {err instanceof Error ? err.message : "unknown error"}
          </p>
        </div>
        <p style={{ marginTop: "1.5rem" }}>
          <a className="btn btn--ghost" href="/" style={{ textDecoration: "none" }}>
            {s.goBack}
          </a>
        </p>
      </main>
    );
  }
}
