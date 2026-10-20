import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db.js";

await prisma.$connect(); // fail fast if the database is unreachable
console.log("✅ Postgres connected");

app.listen(env.PORT, () => {
  console.log(`🚀 API running on http://localhost:${env.PORT}`);
});