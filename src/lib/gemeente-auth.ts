import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper: haal gemeente naam op uit sessie en valideer autorisatie
export async function getGemeenteSession() {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Niet ingelogd" }, { status: 401 }), gemeenteNaam: null, userId: null }
  }

  const role = session.user.role
  if (role !== "GEMEENTE_ADMIN" && role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Geen toegang" }, { status: 403 }), gemeenteNaam: null, userId: null }
  }

  const gemeenteNaam = session.user.gemeenteNaam
  if (!gemeenteNaam && role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Geen gemeente gekoppeld" }, { status: 400 }), gemeenteNaam: null, userId: null }
  }

  return { error: null, gemeenteNaam, userId: session.user.id }
}

// Audit log: registreer gemeente portaal acties
export async function logGemeenteAudit(
  userId: string | null,
  actie: string,
  entiteit: string,
  details?: Record<string, unknown>
) {
  if (!userId) return
  try {
    await prisma.auditLog.create({
      data: { userId, actie, entiteit, details: (details || {}) as any },
    })
  } catch {
    // Silently fail - audit logging mag de hoofdflow niet blokkeren
  }
}

// K-anonimiteit: minimaal 10 gebruikers voor statistieken
export const K_ANONIMITEIT_MINIMUM = 10
