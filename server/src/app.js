import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import serviceRoutes from "./routes/services.js";
export const app = express();

app.set("trust proxy", 1); // Render sits behind a proxy; needed for correct client IPs (rate limiting)
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json()); // reads JSON bodies → req.body
app.use(express.urlencoded({ extended: false })); // reads form bodies (SSLCommerz sends these on Day 6)
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── Routes are added here on Day 2+ (ABOVE notFound) ──
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use(notFound);
app.use(errorHandler);
