import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createReview } from "../services/review.js";

const router = Router();

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

router.post("/", requireAuth, requireRole("CUSTOMER"), async (req, res) => {
  const data = reviewSchema.parse(req.body);
  const review = await createReview({ customerId: req.user.id, ...data });
  res.status(201).json({ review });
});

export default router;
