import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { getMyProvider } from "../utils/provider.js";
import { dhakaToUtc, weekdayOf, isValidDateStr } from "../utils/time.js";
import { getFreeSlots } from "../utils/slots.js";
import { blockingBookingWhere } from "../utils/blocking.js";

const router = Router();

// ── PROVIDER: my profile + hours. MUST be above "/:id" ─────────
router.get("/me", requireAuth, requireRole("PROVIDER"), async (req, res) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    include: { availability: { orderBy: { weekday: "asc" } } },
  });
  res.json({ profile });
});

const availabilitySchema = z.object({
  days: z
    .array(
      z
        .object({
          weekday: z.number().int().min(0).max(6),
          startMin: z
            .number()
            .int()
            .min(0)
            .max(24 * 60),
          endMin: z
            .number()
            .int()
            .min(0)
            .max(24 * 60),
        })
        .refine(
          (d) => d.endMin > d.startMin,
          "End time must be after start time",
        ),
    )
    .max(7)
    .refine(
      (days) => new Set(days.map((d) => d.weekday)).size === days.length,
      "Each weekday only once",
    ),
});

// Replace the whole week in ONE transaction: delete old rows + insert new rows.
router.put(
  "/me/availability",
  requireAuth,
  requireRole("PROVIDER"),
  async (req, res) => {
    const { days } = availabilitySchema.parse(req.body);
    const me = await getMyProvider(req.user.id);

    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { providerId: me.id } }),
      prisma.availability.createMany({
        data: days.map((d) => ({ ...d, providerId: me.id })),
      }),
    ]);

    res.json({ ok: true });
  },
);

// ── PUBLIC: provider profile + services ────────────────────────
router.get("/:id", async (req, res) => {
  const provider = await prisma.providerProfile.findFirst({
    where: { id: req.params.id, approved: true },
    include: {
      user: { select: { name: true } },
      services: { where: { active: true }, include: { category: true } },
    },
  });
  if (!provider) throw new HttpError(404, "Provider not found");
  res.json({ provider });
});

// ── PUBLIC: free slots for one service on one day ──────────────
router.get("/:id/slots", async (req, res) => {
  const { serviceId, date } = z
    .object({
      serviceId: z.string().min(1),
      date: z.string().refine(isValidDateStr, "date must be YYYY-MM-DD"),
    })
    .parse(req.query);
  const providerId = req.params.id;

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      providerId,
      active: true,
      provider: { approved: true },
    },
  });
  if (!service) throw new HttpError(404, "Service not found");

  // 1. Working window for that weekday (null = day off)
  const window = await prisma.availability.findUnique({
    where: { providerId_weekday: { providerId, weekday: weekdayOf(date) } },
  });

  // 2. Blocking bookings that touch this Dhaka day
  const dayStart = dhakaToUtc(date, 0);
  const dayEnd = dhakaToUtc(date, 24 * 60);
  const bookings = await prisma.booking.findMany({
    where: {
      providerId,
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
      ...blockingBookingWhere(),
    },
    select: { startAt: true, endAt: true },
  });

  // 3. Pure calculation
  const slots = getFreeSlots({
    dateStr: date,
    window,
    durationMin: service.durationMin,
    bookings,
    now: new Date(),
  });

  res.json({ date, slots });
});

export default router;
