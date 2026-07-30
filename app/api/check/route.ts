import { NextResponse } from "next/server";
import { check, ClassifyError } from "@/lib/classify";
import { DEFAULT_LANG, isLangCode } from "@/lib/i18n";

// The channel-agnostic endpoint. The Telegram adapter, the iOS Shortcut and the
// eventual WhatsApp webhook all call this and format the same verdict differently.
export async function POST(req: Request) {
  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "send JSON: { text: string, lang?: string }" }, { status: 400 });
  }
  const { text, lang } = body;
  if (typeof text !== "string") {
    return NextResponse.json({ error: "text must be a string" }, { status: 400 });
  }
  const resolved = typeof lang === "string" && isLangCode(lang) ? lang : DEFAULT_LANG;

  try {
    const result = await check(text, resolved);
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof ClassifyError ? 422 : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status });
  }
}
