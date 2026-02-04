import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only create Prisma client if DATABASE_URL is available
// During build, this might not be set, so we create a dummy client
export const prisma = globalForPrisma.prisma ?? (
  process.env.DATABASE_URL
    ? new PrismaClient()
    : new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://dummy:dummy@localhost:5432/dummy'
          }
        }
      })
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
