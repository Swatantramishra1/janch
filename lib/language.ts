import { cookies } from "next/headers";
import { DEFAULT_LANG, isLangCode, LANG_COOKIE, type LangCode } from "./i18n";

export async function readLang(): Promise<LangCode> {
  const jar = await cookies();
  const v = jar.get(LANG_COOKIE)?.value;
  return isLangCode(v) ? v : DEFAULT_LANG;
}
