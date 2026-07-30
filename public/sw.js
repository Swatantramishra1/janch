// Minimal service worker. Chrome wants one before it will offer to install the app,
// and installation is what puts you in the Android share sheet. It deliberately does
// not cache /check — every check must reach the server.
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(
            "<meta charset=utf-8><p style='font-family:sans-serif;padding:2rem'>इंटरनेट नहीं है। जाँच के लिए इंटरनेट ज़रूरी है।",
            { headers: { "content-type": "text/html; charset=utf-8" } },
          ),
      ),
    );
  }
});
