import { Router } from "express";
import { env } from "../config/env.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  initPayment,
  confirmPayment,
  markFailed,
} from "../services/payment.js";
import { validatePayment } from "../services/sslcommerz.js";

const router = Router();

// CUSTOMER: start paying for a booking
router.post(
  "/init/:bookingId",
  requireAuth,
  requireRole("CUSTOMER"),
  async (req, res) => {
    res.json(
      await initPayment({
        bookingId: req.params.bookingId,
        customerId: req.user.id,
      }),
    );
  },
);

// Shared by the success redirect AND the IPN: validate with SSLCommerz, then confirm.
async function validateAndConfirm(valId) {
  const v = await validatePayment(valId);
  return confirmPayment({
    tranId: v.tran_id,
    amount: v.amount,
    currency: v.currency,
    valId,
  });
}

// SSLCommerz sends the BROWSER here (form POST) after paying.
router.post("/success", async (req, res) => {
  let result = "failed";
  try {
    result = await validateAndConfirm(req.body.val_id);
  } catch (err) {
    console.error("Payment success handler:", err.message);
  }
  res.redirect(303, `${env.CLIENT_URL}/payment/${result}`);
});

router.post("/fail", async (req, res) => {
  await markFailed(req.body.tran_id);
  res.redirect(303, `${env.CLIENT_URL}/payment/failed`);
});

router.post("/cancel", async (req, res) => {
  await markFailed(req.body.tran_id);
  res.redirect(303, `${env.CLIENT_URL}/payment/cancelled`);
});

// SSLCommerz calls THIS server-to-server. Always answer 200 so it doesn't retry forever.
router.post("/ipn", async (req, res) => {
  try {
    if (req.body.val_id) await validateAndConfirm(req.body.val_id);
  } catch (err) {
    console.error("IPN handler:", err.message);
  }
  res.json({ received: true });
});

export default router;
