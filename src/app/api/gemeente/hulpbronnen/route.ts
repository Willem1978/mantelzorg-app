import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const [lokaal, nationaal] = await Promise.all([
      prisma.resource.findMany({
        where: {
          city: { equals: gemeenteNaam!, mode: "insensitive" },
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.resource.findMany({
        where: {
          isNational: true,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    logGemeenteAudit(userId, "BEKEKEN", "Hulpbronnen", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      lokaal,
      nationaal,
    })
  } catch (err) {
    console.error("Gemeente hulpbronnen GET error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const body = await request.json()
    const { title, description, category, type, url, content } = body

    // Validatie van verplichte velden
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Titel is verplicht" },
        { status: 400 }
      )
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Beschrijving is verplicht" },
        { status: 400 }
      )
    }

    if (!category || typeof category !== "string" || category.trim().length === 0) {
      return NextResponse.json(
        { error: "Categorie is verplicht" },
        { status: 400 }
      )
    }

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        type: type || "LOCAL_SERVICE",
        url: url?.trim() || null,
        content: content?.trim() || null,
        city: gemeenteNaam,
        isNational: false,
        isActive: true,
      },
    })

    logGemeenteAudit(userId, "AANGEMAAKT", "Hulpbron", { gemeente: gemeenteNaam, resourceId: resource.id })

    return NextResponse.json(
      {
        bericht: "Hulpbron succesvol aangemaakt",
        resource: {
          id: resource.id,
          title: resource.title,
          description: resource.description,
          category: resource.category,
          type: resource.type,
          createdAt: resource.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("Gemeente hulpbronnen POST error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
