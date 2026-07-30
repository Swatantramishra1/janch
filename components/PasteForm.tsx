"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MIN_LEN = 8;

export default function PasteForm({
  placeholder,
  ariaLabel,
  submit: submitLabel,
  submitBusy,
  paste,
  clipboardFoundLabel,
}: {
  placeholder: string;
  ariaLabel: string;
  submit: string;
  submitBusy: string;
  paste: string;
  clipboardFoundLabel: string;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const canSubmit = text.trim().length >= MIN_LEN && !busy;

  // The manifest "shortcuts" entry links here with ?focus=1 so a long-press on the
  // home-screen icon drops the user straight into the textarea, keyboard already up.
  // Read location.search directly rather than useSearchParams — that hook forces a
  // Suspense boundary around the whole page for one param read on mount.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("focus") === "1") {
      textareaRef.current?.focus();
    }
  }, []);

  // Best-effort only. Browsers withhold clipboard access without a prior grant, and
  // this must fail silently — there is no permission prompt we want to force on load.
  useEffect(() => {
    let cancelled = false;
    navigator.clipboard
      ?.readText()
      .then((clip) => {
        if (cancelled) return;
        const trimmed = clip?.trim() ?? "";
        if (trimmed.length >= MIN_LEN) setSuggestion(trimmed);
      })
      .catch(() => {
        // No permission yet, or nothing to read — the manual Paste button covers it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      // Clipboard read denied or unsupported — the textarea is the fallback, and it
      // is already on screen, so there is nothing to explain here.
    }
  }

  function submitText(value: string) {
    if (value.trim().length < MIN_LEN || busy) return;
    setBusy(true);
    router.push(`/check?text=${encodeURIComponent(value.trim())}`);
  }

  return (
    <div>
      {suggestion && (
        <button type="button" className="suggestion" onClick={() => submitText(suggestion)}>
          <span className="suggestion__body">
            <span className="suggestion__label">{clipboardFoundLabel}</span>
            <span className="suggestion__preview">{suggestion}</span>
          </span>
          <span className="suggestion__arrow" aria-hidden="true">→</span>
        </button>
      )}

      <textarea
        ref={textareaRef}
        className="field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={() => submitText(text)} disabled={!canSubmit}>
          {busy ? submitBusy : submitLabel}
        </button>
        <button className="btn btn--ghost" onClick={pasteFromClipboard} type="button">
          {paste}
        </button>
      </div>
    </div>
  );
}
