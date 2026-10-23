import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { getMyProvider } from "../utils/provider.js";
import { isHoldActive } from "../utils/blocking.js";
import { createBooking } from "../services/booking.js";

const router = Router();

const createSchema = z.object({
  serviceId: z.string().min(1),
  startAt: z.coerce.date(), // "2026-11-07T08:00:00.000Z" → Date
  address: z.string().trim().min(5, "Please enter your full address").max(200),
});

// ── CUSTOMER: create ───────────────────────────────────────────
router.post("/", requireAuth, requireRole("CUSTOMER"), async (req, res) => {
  const input = createSchema.parse(req.body);
  const booking = await createBooking({ customerId: req.user.id, ...input });
  res.status(201).json({ booking });
});

// ── CUSTOMER or PROVIDER: my bookings ─────────────────────────
router.get(
  "/me",
  requireAuth,
  requireRole("CUSTOMER", "PROVIDER"),
  async (req, res) => {
    const where =
      req.user.role === "CUSTOMER"
        ? { customerId: req.user.id }
        : { providerId: (await getMyProvider(req.user.id)).id };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startAt: "desc" },
      include: {
        service: { select: { title: true, durationMin: true } },
        customer: { select: { name: true, phone: true } },
        provider: {
          include: { user: { select: { name: true, phone: true } } },
        },
        payment: { select: { status: true, refundRequired: true } },
        review: { select: { id: true, rating: true } },
      },
    });

    // Tell the UI whether an unpaid booking still holds its slot.
    res.json({
      bookings: bookings.map((b) => ({
        ...b,
        holdActive: b.status === "PENDING_PAYMENT" && isHoldActive(b),
      })),
    });
  },
);

// ── CUSTOMER: cancel a future booking (FR-C8) ──────────────────
router.patch(
  "/:id/cancel",
  requireAuth,
  requireRole("CUSTOMER"),
  async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { payment: true },
    });
    if (!booking || booking.customerId !== req.user.id)
      throw new HttpError(404, "Booking not found");
    if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status))
      throw new HttpError(400, "This booking can't be cancelled");
    if (booking.startAt <= new Date())
      throw new HttpError(400, "This booking has already started");

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });
      // Paid already? Flag it so the admin sees a refund to process.
      if (booking.payment?.status === "PAID") {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { refundRequired: true },
        });
      }
    });

    res.json({ ok: true });
  },
);

// ── PROVIDER: mark a started, confirmed job as completed (BR-7) ─
router.patch(
  "/:id/complete",
  requireAuth,
  requireRole("PROVIDER"),
  async (req, res) => {
    const me = await getMyProvider(req.user.id);
    const result = await prisma.booking.updateMany({
      where: {
        id: req.params.id,
        providerId: me.id,
        status: "CONFIRMED",
        startAt: { lte: new Date() },
      },
      data: { status: "COMPLETED" },
    });
    if (result.count === 0)
      throw new HttpError(
        400,
        "Only a confirmed booking that has started can be completed",
      );
    res.json({ ok: true });
  },
);

export default router;
