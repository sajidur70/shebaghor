import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json({ categories });
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { name } = z
    .object({ name: z.string().trim().min(2).max(40) })
    .parse(req.body);

  // "AC Technician" → "ac-technician"
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const category = await prisma.category.create({ data: { name, slug } }); // duplicate → P2002 → 409
  res.status(201).json({ category });
});

export default router;
