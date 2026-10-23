import crypto from "node:crypto";
import { prisma } from "../db.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { blockingBookingWhere, isHoldActive } from "../utils/blocking.js";
import { createSession } from "./sslcommerz.js";

// Returns { url } for the browser to visit next.
export async function initPayment({ bookingId, customerId }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true, service: true },
  });
  if (!booking || booking.customerId !== customerId)
    throw new HttpError(404, "Booking not found");
  if (booking.status !== "PENDING_PAYMENT")
    throw new HttpError(400, "This booking doesn't need payment");
  if (!isHoldActive(booking))
    throw new HttpError(410, "Your 15-minute hold expired. Please book again.");

  // A new unique transaction id for every attempt, e.g. "SG-1730000000000-a1b2c3"
  const tranId = `SG-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  // One Payment row per booking: create it, or reset it for a retry.
  await prisma.payment.upsert({
    where: { bookingId },
    create: { bookingId, tranId, amount: booking.price },
    update: { tranId, amount: booking.price, status: "INITIATED" },
  });

  if (env.PAYMENT_MODE === "mock") {
    const result = await confirmPayment({
      tranId,
      amount: booking.price,
      currency: "BDT",
      valId: "MOCK",
    });
    return { url: `${env.CLIENT_URL}/payment/${result}` };
  }

  return { url: await createSession({ booking, tranId }) };
}

/**
 * Confirms a VERIFIED payment. Safe to call many times (idempotent).
 * Returns "success" or "refund".
 */
export async function confirmPayment({ tranId, amount, currency, valId }) {
  return prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { tranId },
        include: { booking: true },
      });
      if (!payment) throw new HttpError(404, "Payment not found");

      // Already handled (e.g. redirect came first, now the IPN arrives) → do nothing.
      if (payment.status === "PAID")
        return payment.refundRequired ? "refund" : "success";

      if (Number(amount) !== payment.amount || currency !== "BDT") {
        throw new HttpError(400, "Amount or currency mismatch");
      }

      const booking = payment.booking;

      // Same lock as booking creation: nobody can book this provider while we decide.
      await tx.$queryRaw`SELECT id FROM "ProviderProfile" WHERE id = ${booking.providerId} FOR UPDATE`;

      // Claim the payment. Only ONE concurrent call can flip INITIATED → PAID.
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: "INITIATED" },
        data: { status: "PAID", valId },
      });
      if (claimed.count === 0) return "success"; // another call confirmed it a moment ago

      // Edge case (BR-6): the hold expired and someone else took the slot meanwhile,
      // or the customer cancelled before paying.
      const takenByOther = await tx.booking.findFirst({
        where: {
          id: { not: booking.id },
          providerId: booking.providerId,
          startAt: { lt: booking.endAt },
          endAt: { gt: booking.startAt },
          ...blockingBookingWhere(),
        },
        select: { id: true },
      });

      if (booking.status !== "PENDING_PAYMENT" || takenByOther) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: { refundRequired: true },
        });
        return "refund";
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED" },
      });
      return "success";
    },
    { timeout: 10_000 },
  );
}

export async function markFailed(tranId) {
  if (!tranId) return; // IMPORTANT: updateMany with tranId undefined would match EVERY payment!
  await prisma.payment.updateMany({
    where: { tranId, status: "INITIATED" },
    data: { status: "FAILED" },
  });
}
