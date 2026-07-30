"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANGUAGES, LANG_COOKIE, type LangCode } from "@/lib/i18n";

export default function LanguageSelector({
  current,
  label,
}: {
  current: LangCode;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LangCode;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="lang">
      <span className="lang__label">{label}</span>
      <select
        className="lang__select"
        value={current}
        onChange={onChange}
        disabled={pending}
        aria-label={label}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
