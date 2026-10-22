import { prisma } from "../db.js";
import { HttpError } from "./httpError.js";

// Returns the ProviderProfile of the logged-in user (from the JWT, never from the body).
export async function getMyProvider(userId) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
  });
  if (!profile) throw new HttpError(403, "Provider profile not found");
  return profile;
}
