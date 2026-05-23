import { PrismaClient as Silian_PrismaClient } from "@prisma/client"
import { PrismaPg as Silian_PrismaPg } from "@prisma/adapter-pg"

const Silian_globalForPrisma = globalThis as unknown as {
  prisma: Silian_PrismaClient | undefined
}

export const prisma =
  Silian_globalForPrisma.prisma ??
  new Silian_PrismaClient({
    adapter: new Silian_PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
    log: ["query"],
  })

if (process.env.NODE_ENV !== "production") Silian_globalForPrisma.prisma = prisma
