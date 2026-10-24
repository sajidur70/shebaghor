import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Every route in this file: logged in AND admin.
router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", async (req, res) => {
  // 5 independent queries, run in parallel.
  const [usersByRole, bookingsByStatus, revenue, pendingProviders, refunds] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.payment.aggregate({
        where: { status: "PAID", refundRequired: false },
        _sum: { amount: true },
      }),
      prisma.providerProfile.count({ where: { approved: false } }),
      prisma.payment.findMany({
        where: { refundRequired: true },
        include: {
          booking: {
            include: { customer: { select: { name: true, email: true } } },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  res.json({
    usersByRole: Object.fromEntries(
      usersByRole.map((r) => [r.role, r._count._all]),
    ),
    bookingsByStatus: Object.fromEntries(
      bookingsByStatus.map((b) => [b.status, b._count._all]),
    ),
    revenue: revenue._sum.amount ?? 0,
    pendingProviders,
    refunds,
  });
});

router.get("/providers", async (req, res) => {
  const approved = req.query.approved === "true";
  const providers = await prisma.providerProfile.findMany({
    where: { approved },
    include: {
      user: {
        select: { name: true, email: true, phone: true, createdAt: true },
      },
      _count: { select: { services: true } },
    },
    orderBy: { user: { createdAt: "desc" } },
  });
  res.json({ providers });
});

router.patch("/providers/:id/approve", async (req, res) => {
  const { approved } = z.object({ approved: z.boolean() }).parse(req.body);
  const provider = await prisma.providerProfile.update({
    where: { id: req.params.id },
    data: { approved },
  });
  res.json({ provider }); // unknown id → P2025 → 404 via the error handler
});

export default router;
