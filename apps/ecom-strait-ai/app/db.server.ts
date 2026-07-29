import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Cache on globalThis in every environment. On Vercel a warm lambda re-uses the
// module, but reloads (and dev HMR) would otherwise open a new pool each time
// and exhaust Postgres connections.
const prisma = global.prismaGlobal ?? new PrismaClient();
global.prismaGlobal = prisma;

export default prisma;
