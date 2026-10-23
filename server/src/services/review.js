import { prisma } from "../db.js";
import { HttpError } from "../utils/httpError.js";

export async function createReview({ customerId, bookingId, rating, comment }) {
  try {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.customerId !== customerId)
        throw new HttpError(404, "Booking not found");
      if (booking.status !== "COMPLETED")
        throw new HttpError(400, "You can only review completed jobs");

      // Unique bookingId → a second review fails with P2002.
      const review = await tx.review.create({
        data: {
          bookingId,
          customerId,
          providerId: booking.providerId,
          rating,
          comment,
        },
      });

      // Running average, updated atomically in SQL.
      await tx.$executeRaw`
        UPDATE "ProviderProfile"
        SET "ratingAvg"   = ("ratingAvg" * "ratingCount" + ${rating}) / ("ratingCount" + 1),
            "ratingCount" = "ratingCount" + 1
        WHERE id = ${booking.providerId}`;

      return review;
    });
  } catch (err) {
    if (err.code === "P2002")
      throw new HttpError(409, "You already reviewed this booking");
    throw err;
  }
}
