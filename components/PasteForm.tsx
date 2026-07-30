"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PasteForm({
  placeholder,
  ariaLabel,
  submit: submitLabel,
  submitBusy,
  paste,
}: {
  placeholder: string;
  ariaLabel: string;
  submit: string;
  submitBusy: string;
  paste: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = text.trim().length >= 8 && !busy;

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      // Clipboard read denied or unsupported — the textarea is the fallback, and it
      // is already on screen, so there is nothing to explain here.
    }
  }

  function submit() {
    if (!canSubmit) return;
    setBusy(true);
    router.push(`/check?text=${encodeURIComponent(text.trim())}`);
  }

  return (
    <div>
      <textarea
        className="field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={submit} disabled={!canSubmit}>
          {busy ? submitBusy : submitLabel}
        </button>
        <button className="btn btn--ghost" onClick={pasteFromClipboard} type="button">
          {paste}
        </button>
      </div>
    </div>
  );
}
