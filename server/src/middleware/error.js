import { ZodError } from "zod";

export function notFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}

// Express knows this is an error handler because it has 4 parameters.
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid input",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
  // Prisma error codes: https://www.prisma.io/docs/orm/reference/error-reference
  if (err.code === "P2002")
    return res.status(409).json({ error: "Already exists" });
  if (err.code === "P2003")
    return res.status(400).json({ error: "Related record not found" });
  if (err.code === "P2025") return res.status(404).json({ error: "Not found" });

  if (err.status) return res.status(err.status).json({ error: err.message });

  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
}
