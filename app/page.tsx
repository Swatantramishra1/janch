import PasteForm from "@/components/PasteForm";
import { readLang } from "@/lib/language";
import { strings } from "@/lib/i18n";

export default async function Home() {
  const lang = await readLang();
  const s = strings(lang);

  return (
    <main>
      <h1 className="lede">{s.headline}</h1>
      <p className="sub">{s.subheadline}</p>

      <PasteForm
        placeholder={s.textareaPlaceholder}
        ariaLabel={s.textareaLabel}
        submit={s.submit}
        submitBusy={s.submitBusy}
        paste={s.paste}
      />

      <hr className="hairline" />

      <h2 className="eyebrow" style={{ display: "block", marginBottom: "0.75rem" }}>
        {s.installTitle}
      </h2>
      <ol className="steps">
        <li>{s.installStep1}</li>
        <li>{s.installStep2}</li>
        <li>{s.installStep3}</li>
      </ol>
      <p className="note" style={{ marginTop: "1.25rem" }}>
        {s.privacyNote}
      </p>
    </main>
  );
}
