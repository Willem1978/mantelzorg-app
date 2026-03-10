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

  const gemeenteRollen: string[] = session.user.gemeenteRollen || []

  return { error: null, gemeenteNaam, userId: session.user.id, gemeenteRollen }
}

// Helper: controleer of gebruiker een specifieke gemeente-subrol heeft
// Hoofdadmins (geen subrollen) hebben altijd toegang, ADMIN ook
export async function checkGemeenteRol(vereist: string) {
  const sessie = await getGemeenteSession()
  if (sessie.error) return sessie

  const isHoofdAdmin = sessie.gemeenteRollen.length === 0
  if (!isHoofdAdmin && !sessie.gemeenteRollen.includes(vereist)) {
    return {
      ...sessie,
      error: NextResponse.json({ error: "Geen toegang tot deze functie" }, { status: 403 }),
    }
  }

  return sessie
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
