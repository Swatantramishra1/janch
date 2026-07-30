import { extractUrls, hostOf } from "./normalize";
import type { Verdict } from "./classify";

// Domains a model cannot verify from text alone. This is the fix for the BESCOM-style
// false alarm: the hedge was correct reasoning about a domain it had no way to check.
// Add entries only for domains you have actually verified yourself.
const ALLOWED_SUFFIXES = [
  "gov.in",
  "nic.in",
  "rbi.org.in",
  "npci.org.in",
  "irctc.co.in",
  "uidai.gov.in",
  "epfindia.gov.in",
  "onlinesbi.sbi",
  "hdfcbank.com",
  "icicibank.com",
  "axisbank.com",
  "kotak.com",
  "pnbindia.in",
  "bankofbaroda.in",
  "amazon.in",
  "flipkart.com",
  "swiggy.com",
  "zomato.com",
  "jio.com",
  "airtel.in",
];

// Presence of any of these means no downgrade happens, whatever the domain says.
const HARD_SIGNALS: Array<[RegExp, string]> = [
  [/\b(otp|o\.t\.p|pin|cvv|upi pin|एमपिन|ओटीपी|पिन)\b.{0,40}\b(share|bhej|batao|daal|enter|बताइए|भेज|डाल)/is, "PIN or OTP requested"],
  [/\b(anydesk|teamviewer|quicksupport|screen share|remote access)\b/i, "remote-access app requested"],
  [/\.apk\b/i, "APK install"],
  [/\b(bit\.ly|tinyurl|t\.co|rb\.gy|cutt\.ly|is\.gd|shorturl|rebrand\.ly)\b/i, "URL shortener"],
  [/\b(digital arrest|do not (?:disconnect|inform)|kisi ko mat bata)\b/i, "isolation instruction"],
];

const SEVERITY = { no_signals: 0, be_careful: 1, likely_scam: 2 } as const;

export type RuleOutcome = {
  verdict: Verdict["verdict"];
  downgradedBy?: string;
  hardSignals: string[];
};

function onAllowlist(host: string): boolean {
  return ALLOWED_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
}

/**
 * Post-processing. The only permitted direction is downward, and only from
 * `be_careful` to `no_signals`. Nothing here can ever turn a scam into a safe verdict,
 * which is why the rule set is allowed to be this blunt.
 */
export function applyRules(model: Verdict, text: string): RuleOutcome {
  const hardSignals = HARD_SIGNALS.filter(([re]) => re.test(text)).map(([, label]) => label);

  if (model.verdict !== "be_careful") return { verdict: model.verdict, hardSignals };
  if (hardSignals.length > 0) return { verdict: model.verdict, hardSignals };
  if ((model.confidence ?? 1) >= 0.6) return { verdict: model.verdict, hardSignals };

  const hosts = extractUrls(text).map(hostOf).filter((h): h is string => Boolean(h));
  if (hosts.length === 0 || !hosts.every(onAllowlist)) {
    return { verdict: model.verdict, hardSignals };
  }

  return {
    verdict: "no_signals",
    downgradedBy: `all links on verified list (${hosts.join(", ")}), low model confidence, no hard signal`,
    hardSignals,
  };
}

export { SEVERITY };
