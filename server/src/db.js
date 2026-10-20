import { PrismaClient } from "@prisma/client";

// One client for the whole app. It manages a pool of connections.
export const prisma = new PrismaClient();
