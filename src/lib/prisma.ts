import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * La base Neon (offre gratuite) s'endort après inactivité et met quelques secondes à se réveiller.
 * On laisse donc au premier accès jusqu'à 20 s pour établir la connexion au lieu des 5 s par défaut,
 * sinon la première visite du matin tombait en erreur.
 */
function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (/[?&]connect_timeout=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connect_timeout=20`;
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: datasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
