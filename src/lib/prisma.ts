import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[PRISMA] KRITIEK: DATABASE_URL is niet ingesteld! Database operaties zullen falen.')
    }
  }
  try {
    return new PrismaClient()
  } catch (e) {
    console.error('[PRISMA] Fout bij aanmaken PrismaClient:', e)
    // Return een client die bij elke query een duidelijke fout geeft
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === 'then') return undefined
        return () => {
          throw new Error(`Database niet beschikbaar (PrismaClient kon niet worden aangemaakt)`)
        }
      },
    })
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
