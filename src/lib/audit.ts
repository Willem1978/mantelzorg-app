import { prisma } from "./prisma"

export async function logAudit({
  userId,
  actie,
  entiteit,
  entiteitId,
  details,
  ipAdres,
}: {
  userId: string
  actie: string
  entiteit: string
  entiteitId?: string
  details?: Record<string, any>
  ipAdres?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        actie,
        entiteit,
        entiteitId: entiteitId || null,
        details: details || undefined,
        ipAdres: ipAdres || null,
      },
    })
  } catch (error) {
    console.error("Audit log fout:", error)
  }
}
