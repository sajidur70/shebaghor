import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// 20 attempts per 15 minutes per IP on register/login.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().toLowerCase().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    phone: z.string().trim().max(20).optional(),
    role: z.enum(["CUSTOMER", "PROVIDER"]).default("CUSTOMER"), // ADMIN is impossible (BR-10)
    area: z.string().trim().min(2).max(40).optional(),
  })
  .refine((d) => d.role !== "PROVIDER" || d.area, {
    message: "Area is required for providers",
    path: ["area"],
  });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Never send passwordHash to the browser.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    provider: user.provider
      ? {
          id: user.provider.id,
          approved: user.provider.approved,
          area: user.provider.area,
        }
      : null,
  };
}

router.post("/register", authLimiter, async (req, res) => {
  const data = registerSchema.parse(req.body); // throws ZodError → 400

  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new HttpError(409, "This email is already registered");

  const passwordHash = await bcrypt.hash(data.password, 10);

  // Nested create: User + ProviderProfile are inserted in ONE transaction.
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      ...(data.role === "PROVIDER" && {
        provider: { create: { area: data.area } },
      }),
    },
    include: { provider: true },
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { provider: true },
  });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));

  // Same message for "no such email" and "wrong password", so attackers can't
  // find out which emails are registered (user enumeration).
  if (!ok) throw new HttpError(401, "Wrong email or password");

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { provider: true },
  });
  if (!user) throw new HttpError(401, "Account no longer exists");
  res.json({ user: publicUser(user) });
});

export default router;
