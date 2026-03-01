import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // During build (prisma generate), DATABASE_URL may not be available
    // In production runtime, this should always be set
    if (process.env.NODE_ENV === 'production') {
      console.error('[PRISMA] KRITIEK: DATABASE_URL is niet ingesteld! Database operaties zullen falen.')
    }
    // Return client without explicit URL — will fail on actual queries with a clear error
    return new PrismaClient()
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
