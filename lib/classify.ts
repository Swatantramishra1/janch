import { systemPrompt, userPrompt } from "./prompt";
import { cacheKey, stripShareChrome } from "./normalize";
import { applyRules } from "./rules";
import { DEFAULT_LANG, type LangCode } from "./i18n";

export type VerdictName = "likely_scam" | "be_careful" | "no_signals";

export type Verdict = {
  verdict: VerdictName;
  confidence: number;
  category: string;
  reason: string;
  action: string;
  entities?: {
    urls?: string[];
    upi_ids?: string[];
    phone_numbers?: string[];
    amounts?: string[];
    impersonated_brand?: string | null;
  };
  report_worthy?: boolean;
};

export type CheckResult = Verdict & {
  cached: boolean;
  downgradedBy?: string;
  hardSignals: string[];
  latencyMs: number;
  lang: LangCode;
};

// Process-local, so it dies on every deploy and is not shared across serverless
// instances. That is fine for a phone-sized test and wrong for launch: swap in Redis
// (key -> verdict JSON) before more than one person uses this.
const cache = new Map<string, Verdict>();
const MAX_CACHE = 5_000;

class ClassifyError extends Error {}

async function callModel(text: string, lang: LangCode): Promise<Verdict> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ClassifyError("ANTHROPIC_API_KEY is not set on the server");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLASSIFIER_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 700,
      // The system prompt is ~1400 static tokens on every single check. Caching it is
      // the difference between the model costing more than WhatsApp delivery and less.
      system: [{ type: "text", text: systemPrompt(lang), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt(text) }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ClassifyError(`model returned ${res.status}: ${body.slice(0, 200)}`);
  }

  const payload = await res.json();
  const raw: string = (payload.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");

  return parseVerdict(raw);
}

export function parseVerdict(raw: string): Verdict {
  const cleaned = raw.replace(/^```(?:json)?|```$/gm, "").trim();
  const candidates = [cleaned, cleaned.match(/\{[\s\S]*\}/)?.[0] ?? ""];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const parsed = JSON.parse(c);
      if (["likely_scam", "be_careful", "no_signals"].includes(parsed.verdict)) {
        // Older prompts used reason_hi/action_hi. Accept them so cached rows and
        // in-flight responses do not break the render.
        if (parsed.reason == null && typeof parsed.reason_hi === "string") parsed.reason = parsed.reason_hi;
        if (parsed.action == null && typeof parsed.action_hi === "string") parsed.action = parsed.action_hi;
        return parsed as Verdict;
      }
    } catch {
      /* try the next candidate */
    }
  }
  throw new ClassifyError("model did not return a usable verdict");
}

export async function check(rawText: string, lang: LangCode = DEFAULT_LANG): Promise<CheckResult> {
  const started = Date.now();
  const text = stripShareChrome(rawText);
  if (text.length < 8) throw new ClassifyError("message too short to check");
  if (text.length > 4000) throw new ClassifyError("message too long — share the relevant part");

  const key = `${lang}:${cacheKey(text)}`;
  const hit = cache.get(key);
  const model = hit ?? (await callModel(text, lang));

  if (!hit) {
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
    cache.set(key, model);
  }

  const ruled = applyRules(model, text);
  return {
    ...model,
    verdict: ruled.verdict,
    downgradedBy: ruled.downgradedBy,
    hardSignals: ruled.hardSignals,
    cached: Boolean(hit),
    latencyMs: Date.now() - started,
    lang,
  };
}

export { ClassifyError };
