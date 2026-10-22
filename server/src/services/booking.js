import { prisma } from "../db.js";
import { HttpError } from "../utils/httpError.js";
import { addMinutes, utcToDhaka, weekdayOf } from "../utils/time.js";
import { blockingBookingWhere } from "../utils/blocking.js";

export async function createBooking({
  customerId,
  serviceId,
  startAt,
  address,
}) {
  // ── Validation that doesn't need the lock ─────────────────────
  const service = await prisma.service.findFirst({
    where: { id: serviceId, active: true, provider: { approved: true } },
  });
  if (!service) throw new HttpError(404, "Service not found");

  if (startAt <= new Date())
    throw new HttpError(400, "Please pick a time in the future");

  const endAt = addMinutes(startAt, service.durationMin);

  // BR-2: must fit inside the provider's working window for that Dhaka day
  const { dateStr, minutes } = utcToDhaka(startAt);
  const window = await prisma.availability.findUnique({
    where: {
      providerId_weekday: {
        providerId: service.providerId,
        weekday: weekdayOf(dateStr),
      },
    },
  });
  if (
    !window ||
    minutes < window.startMin ||
    minutes + service.durationMin > window.endMin
  ) {
    throw new HttpError(
      400,
      "That time is outside the provider's working hours",
    );
  }

  // ── The critical section ──────────────────────────────────────
  return prisma.$transaction(
    async (tx) => {
      // 1. LOCK this provider's row. A second booking for the same provider WAITS here.
      await tx.$queryRaw`SELECT id FROM "ProviderProfile" WHERE id = ${service.providerId} FOR UPDATE`;

      // 2. CHECK for any blocking booking that overlaps [startAt, endAt)
      const clash = await tx.booking.findFirst({
        where: {
          providerId: service.providerId,
          startAt: { lt: endAt }, // existing.start < new.end
          endAt: { gt: startAt }, // existing.end   > new.start
          ...blockingBookingWhere(),
        },
        select: { id: true },
      });
      if (clash)
        throw new HttpError(
          409,
          "Sorry, this slot was just taken. Please pick another time.",
        );

      // 3. INSERT: status PENDING_PAYMENT holds the slot for 15 minutes (BR-4)
      return tx.booking.create({
        data: {
          customerId,
          providerId: service.providerId,
          serviceId,
          startAt,
          endAt,
          address,
          price: service.price, // snapshot (BR-5)
        },
      });
    },
    { timeout: 10_000 }, // queued requests may wait a moment for the lock
  );
}
