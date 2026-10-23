import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const BASE = "https://sandbox.sslcommerz.com"; // live would be https://securepay.sslcommerz.com

// Ask SSLCommerz to create a payment page. Returns the URL to send the browser to.
export async function createSession({ booking, tranId }) {
  const body = new URLSearchParams({
    store_id: env.SSLC_STORE_ID,
    store_passwd: env.SSLC_STORE_PASSWORD,
    total_amount: String(booking.price),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${env.SERVER_URL}/api/payments/success`,
    fail_url: `${env.SERVER_URL}/api/payments/fail`,
    cancel_url: `${env.SERVER_URL}/api/payments/cancel`,
    ipn_url: `${env.SERVER_URL}/api/payments/ipn`,
    shipping_method: "NO",
    product_name: booking.service.title,
    product_category: "Service",
    product_profile: "non-physical-goods",
    cus_name: booking.customer.name,
    cus_email: booking.customer.email,
    cus_add1: booking.address,
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: booking.customer.phone || "01700000000",
  });

  const res = await fetch(`${BASE}/gwprocess/v4/api.php`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (data.status !== "SUCCESS")
    throw new HttpError(502, data.failedreason || "Payment gateway error");
  return data.GatewayPageURL;
}

// Server-to-server check. NEVER skip this.
export async function validatePayment(valId) {
  if (!valId) throw new HttpError(400, "Missing val_id");
  const url = new URL(`${BASE}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({
    val_id: valId,
    store_id: env.SSLC_STORE_ID,
    store_passwd: env.SSLC_STORE_PASSWORD,
    format: "json",
  });

  const data = await fetch(url).then((r) => r.json());
  if (!["VALID", "VALIDATED"].includes(data.status))
    throw new HttpError(400, "Payment is not valid");
  return data; // includes tran_id, amount, currency
}
