import type { Metadata, Viewport } from "next";
import "./globals.css";
import LanguageSelector from "@/components/LanguageSelector";
import { readLang } from "@/lib/language";
import { langMeta, strings } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await readLang();
  const s = strings(lang);
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: s.wordmark },
  };
}

export const viewport: Viewport = {
  themeColor: "#eef0ea",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await readLang();
  const meta = langMeta(lang);
  const s = strings(lang);

  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Bengali:wght@400;600&family=Noto+Sans+Tamil:wght@400;600&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Gujarati:wght@400;600&family=Noto+Sans+Kannada:wght@400;600&family=Noto+Sans+Malayalam:wght@400;600&family=Noto+Sans+Gurmukhi:wght@400;600&family=Noto+Sans+Oriya:wght@400;600&family=Noto+Nastaliq+Urdu:wght@400;600&family=Courier+Prime&display=swap"
        />
      </head>
      <body>
        <div className="shell">
          <header className="masthead">
            <span className="wordmark">{s.wordmark}</span>
            <LanguageSelector current={lang} label={s.languageLabel} />
          </header>
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}`,
          }}
        />
      </body>
    </html>
  );
}
