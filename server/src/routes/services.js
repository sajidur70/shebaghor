import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { getMyProvider } from "../utils/provider.js";

const router = Router();

const serviceSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(1000),
  categoryId: z.string().min(1),
  price: z.coerce.number().int().min(50).max(100000),
  durationMin: z.coerce
    .number()
    .int()
    .refine(
      (n) => n >= 30 && n <= 480 && n % 30 === 0,
      "Duration must be 30–480 minutes, in steps of 30",
    ),
  area: z.string().trim().min(2).max(40),
});

const searchSchema = z.object({
  q: z.string().trim().max(60).optional(),
  category: z.string().trim().optional(), // category slug
  area: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12), // cap it, so nobody asks for 1,000,000
});

// What a public service card needs (no emails or password hashes!)
const publicInclude = {
  category: true,
  provider: { include: { user: { select: { name: true } } } },
};

// ── PUBLIC: search ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { q, category, area, page, pageSize } = searchSchema.parse(req.query);

  const where = {
    active: true, // BR-9: hide soft-deleted
    provider: { approved: true }, // BR-1: hide unapproved providers
    ...(category && { category: { slug: category } }),
    ...(area && { area: { equals: area, mode: "insensitive" } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  // Run both queries at the same time instead of one after the other.
  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: publicInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.service.count({ where }),
  ]);

  res.json({
    services,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

// ── PROVIDER: my services. MUST be above "/:id" ───────────────
router.get("/mine", requireAuth, requireRole("PROVIDER"), async (req, res) => {
  const me = await getMyProvider(req.user.id);
  const services = await prisma.service.findMany({
    where: { providerId: me.id, active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ services });
});

// ── PUBLIC: one service ────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const service = await prisma.service.findFirst({
    where: { id: req.params.id, active: true, provider: { approved: true } },
    include: publicInclude,
  });
  if (!service) throw new HttpError(404, "Service not found");
  res.json({ service });
});

// ── PROVIDER: create ───────────────────────────────────────────
router.post("/", requireAuth, requireRole("PROVIDER"), async (req, res) => {
  const data = serviceSchema.parse(req.body);
  const me = await getMyProvider(req.user.id);
  const service = await prisma.service.create({
    data: { ...data, providerId: me.id },
  });
  res.status(201).json({ service });
});

// ── PROVIDER: edit (only my own) ───────────────────────────────
router.patch("/:id", requireAuth, requireRole("PROVIDER"), async (req, res) => {
  const data = serviceSchema.partial().parse(req.body); // every field optional
  const me = await getMyProvider(req.user.id);

  // The ownership check lives in the WHERE: id AND providerId must both match.
  const result = await prisma.service.updateMany({
    where: { id: req.params.id, providerId: me.id, active: true },
    data,
  });
  if (result.count === 0) throw new HttpError(404, "Service not found");

  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
  });
  res.json({ service });
});

// ── PROVIDER: soft delete (only my own) ────────────────────────
router.delete(
  "/:id",
  requireAuth,
  requireRole("PROVIDER"),
  async (req, res) => {
    const me = await getMyProvider(req.user.id);
    const result = await prisma.service.updateMany({
      where: { id: req.params.id, providerId: me.id, active: true },
      data: { active: false },
    });
    if (result.count === 0) throw new HttpError(404, "Service not found");
    res.status(204).end();
  },
);

export default router;
