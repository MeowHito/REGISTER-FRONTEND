// Drop-in replacement for the Netlify function netlify/functions/return-2c2p.cjs
// for non-Netlify (nginx) hosting. Receives the 2C2P POST callback and 303-redirects
// the browser to the SPA result route (POST -> GET bridge).
//
// No npm dependencies (uses Node's built-in http). nginx proxies the
// /.netlify/functions/return-2c2p path to this service.

const http = require("http");
const PORT = process.env.PORT || 8787;

const server = http.createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy(); // guard against oversized payloads
  });
  req.on("end", () => {
    const ct = req.headers["content-type"] || "";
    let paymentResponse = "";
    try {
      if (ct.includes("application/x-www-form-urlencoded")) {
        paymentResponse = new URLSearchParams(body).get("paymentResponse") || "";
      } else if (ct.includes("application/json")) {
        paymentResponse = JSON.parse(body || "{}").paymentResponse || "";
      } else {
        paymentResponse = (body || "").trim();
      }
    } catch {
      paymentResponse = "";
    }

    // TODO (optional): verify signature + update order status server-side here.
    res.writeHead(303, {
      Location: `/registrationPaymentResult?payload=${encodeURIComponent(paymentResponse)}`,
    });
    res.end();
  });
});

server.listen(PORT, () => console.log(`return-2c2p bridge listening on :${PORT}`));
