import { prisma } from "./prisma"

export async function logAudit({
  userId,
  actie,
  entiteit,
  entiteitId,
  details,
}: {
  userId: string
  actie: string
  entiteit: string
  entiteitId?: string
  details?: Record<string, any>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        actie,
        entiteit,
        entiteitId: entiteitId || null,
        details: details || null,
      },
    })
  } catch (error) {
    console.error("Audit log fout:", error)
  }
}
