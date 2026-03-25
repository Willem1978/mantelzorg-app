import { PrismaClient } from '@prisma/client'
import { createLogger } from '@/lib/logger'

const log = createLogger('prisma')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      log.fatal('DATABASE_URL is niet ingesteld! Database operaties zullen falen.')
    }
  }
  try {
    if (process.env.NODE_ENV !== 'production') {
      return new PrismaClient({
        log: [{ emit: 'event', level: 'query' }],
      })
    }
    return new PrismaClient()
  } catch (e) {
    log.error({ err: e }, 'Fout bij aanmaken PrismaClient')
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

// Development-only: log trage queries (>100ms) voor N+1 detectie
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma

  // Event listener voor query logging (alleen als emit: 'event' is geconfigureerd)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(prisma as any).$on?.('query', (e: { query: string; duration: number; params: string }) => {
      if (e.duration > 100) {
        log.warn({
          durationMs: e.duration,
          query: e.query.substring(0, 200),
        }, `Trage query (${e.duration}ms)`)
      }
    })
  } catch {
    // $on niet beschikbaar — geen probleem
  }
}

export default prisma
