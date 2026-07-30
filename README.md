# जाँच — Android share-target build

A PWA that receives one forwarded message from the Android share sheet and returns a Hindi verdict. No message reading, no permissions, no Play Store.

```
app/page.tsx          paste box + install instructions
app/check/page.tsx    the share target — Android lands here with ?text=…
app/api/check/route.ts  JSON endpoint; the Telegram adapter and WhatsApp webhook will call this
lib/prompt.ts         keep byte-identical to prompt_v1.py in the eval repo
lib/normalize.ts      strips WhatsApp forward chrome, builds the cache key
lib/rules.ts          allowlist + hard-signal layer; can only ever soften a hedge
lib/classify.ts       cache → model (with prompt caching) → rules
public/manifest.webmanifest   share_target lives here
```

## Run it

```bash
npm install
cp .env.example .env.local     # put your real key in .env.local
npm run dev                    # http://localhost:3000
```

Paste a message on the home page — that path works immediately and needs no install.

## Get it onto your phone as a share target

The share sheet only lists **installed** PWAs, and Chrome only installs from a **secure context**. `http://192.168.x.x:3000` is not one, so a plain LAN address will never work. Two ways around it:

**USB (no account, no tunnel):**

```bash
adb reverse tcp:3000 tcp:3000
```

Now open `http://localhost:3000` in Chrome *on the phone* — it's treated as secure, so install works.

**Deploy (better for handing to family):**

```bash
npx vercel        # set ANTHROPIC_API_KEY in the project's env vars
```

Then on the phone: open the URL in Chrome → ⋮ → **Add to Home screen** → open the installed icon once.

Test the loop: open WhatsApp, long-press any message → Share → **जाँच**. The message arrives at `/check` and the verdict renders.

If जाँच doesn't appear in the share sheet: it isn't installed (a browser bookmark is not an install), or the manifest didn't load — check `chrome://inspect` and confirm `/manifest.webmanifest` returns 200 with `application/manifest+json`.

## Configuration

| Env | Default | Note |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Server only. Never `NEXT_PUBLIC_`, or it ships to the phone and gets scraped. |
| `CLASSIFIER_MODEL` | `claude-haiku-4-5-20251001` | Switch to `claude-sonnet-5` to compare against your eval numbers. |

The system prompt is sent with `cache_control: ephemeral`, so repeat checks within the cache window pay ~10% on those ~1,400 static input tokens.

## Deliberately not built yet

- **Screenshot checks.** Most real forwards from older relatives are images. That needs `method: "POST"` on the share target, `multipart/form-data`, a file param, and a vision prompt — a different accuracy problem, so it gets its own eval before it gets code.
- **Persistence.** The dedupe cache is an in-process `Map`. It dies on deploy and isn't shared between serverless instances. Swap in Redis before a second person uses this.
- **Rate limiting.** Anyone with the URL can spend your API credit. Add a per-IP cap before you post the link anywhere.
- **Logging.** Nothing is recorded, so you can't yet see which messages people check. When you add it, store the cache key and the verdict — never the message body.
- **Telegram adapter.** Roughly 40 lines against `/api/check`; that's how iPhone users get in.

## Things that are load-bearing, not stylistic

The `no_signals` card says "इसमें धोखे का कोई संकेत नहीं मिला। इसका मतलब यह नहीं कि यह पक्का सही है।" — never "safe". Domains are set in monospace so a lookalike host is visually inspectable. `lib/rules.ts` can only move `be_careful` → `no_signals`, never anything → safer-than-the-model-said for a scam. Keep all three when you redesign.
# janch
