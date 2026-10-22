export const HOLD_MINUTES = 15;

/**
 * A booking blocks its time if it is:
 *   - CONFIRMED or COMPLETED, OR
 *   - PENDING_PAYMENT and created less than 15 minutes ago (the payment hold).
 * Old unpaid bookings stop blocking on their own, with no cron job needed.
 * This ONE helper is used by both the slots endpoint and the booking endpoint,
 * so what customers see always matches what the server enforces.
 */
export function blockingBookingWhere(now = new Date()) {
  const holdStartedAfter = new Date(now.getTime() - HOLD_MINUTES * 60_000);
  return {
    OR: [
      { status: { in: ["CONFIRMED", "COMPLETED"] } },
      { status: "PENDING_PAYMENT", createdAt: { gt: holdStartedAfter } },
    ],
  };
}

export function isHoldActive(booking, now = new Date()) {
  return now.getTime() - booking.createdAt.getTime() < HOLD_MINUTES * 60_000;
}
