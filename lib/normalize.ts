import { createHash } from "node:crypto";

// Android hands you the raw text the user shared. WhatsApp prepends a timestamp and
// sender name per line; SMS apps sometimes append the sender number. None of that is
// the scam, and all of it defeats a cache key, so it goes first.
const WA_LINE_PREFIX = /^\s*\[?\d{1,2}[:.]\d{2}(?:\s?[apAP][mM])?,?\s*\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\]?\s*[-–]?\s*[^:\n]{0,40}:\s*/gm;
const ZERO_WIDTH = /[\u200b-\u200f\u202a-\u202e\ufeff]/g;

export function stripShareChrome(raw: string): string {
  return raw
    .replace(ZERO_WIDTH, "")
    .replace(WA_LINE_PREFIX, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// The cache key is deliberately lossier than the text we send the model: the same
// campaign arrives with different amounts, names and shortener slugs, and we still
// want a hit. Digits and URLs collapse to placeholders.
export function cacheKey(text: string): string {
  const canonical = stripShareChrome(text)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " «url» ")
    .replace(/\b[\w.-]+@[\w]{2,}\b/g, " «vpa» ")
    .replace(/\d[\d,]{2,}/g, " «num» ")
    .replace(/[^\p{L}\p{N}«»\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+|(?:^|\s)((?:[\w-]+\.)+[a-z]{2,})(?:\/\S*)?/gi) ?? [];
  return matches.map((m) => m.trim()).filter(Boolean);
}

export function hostOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}
