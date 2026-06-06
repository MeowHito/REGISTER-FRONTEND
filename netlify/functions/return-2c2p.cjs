exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ct = event.headers["content-type"] || "";
  let paymentResponse = "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(event.body || "");
    paymentResponse = params.get("paymentResponse") || "";
  } else if (ct.includes("application/json")) {
    const body = JSON.parse(event.body || "{}");
    paymentResponse = body.paymentResponse || "";
  } else {
    paymentResponse = (event.body || "").trim();
  }

  // TODO: verify signature + update order status on server here

  // Convert POST -> GET so your SPA can load normally
  return {
    statusCode: 303,
    headers: {
      Location: `/registrationPaymentResult?payload=${encodeURIComponent(paymentResponse)}`
    }
  };
};