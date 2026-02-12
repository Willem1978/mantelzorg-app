import { NextRequest, NextResponse } from 'next/server'
import {
  getAllProvinces,
  getAllMunicipalities,
  getGemeentenByProvincie,
  getWoonplaatsenByGemeente,
  getWijkenByGemeente,
  searchGemeenten,
  searchProvincies,
} from '@/lib/pdok'

export const dynamic = 'force-dynamic'

// GET /api/beheer/locatie - Get location hierarchy data from PDOK (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'provincies', 'gemeenten', 'woonplaatsen', 'wijken'
  const provincie = searchParams.get('provincie')
  const gemeente = searchParams.get('gemeente')
  const zoek = searchParams.get('zoek') // search query for autocomplete

  if (type === 'provincies') {
    if (zoek) {
      const results = await searchProvincies(zoek)
      return NextResponse.json({ provincies: results.map((name) => ({ name })) })
    }
    const provincies = await getAllProvinces()
    return NextResponse.json({ provincies })
  }

  if (type === 'gemeenten') {
    if (zoek) {
      const results = await searchGemeenten(zoek)
      return NextResponse.json({ gemeenten: results })
    }
    if (provincie) {
      const gemeenten = await getGemeentenByProvincie(provincie)
      return NextResponse.json({ gemeenten })
    }
    const all = await getAllMunicipalities()
    return NextResponse.json({ gemeenten: all.map((m) => m.name) })
  }

  if (type === 'woonplaatsen' && gemeente) {
    const woonplaatsen = await getWoonplaatsenByGemeente(gemeente)
    return NextResponse.json({ woonplaatsen })
  }

  if (type === 'wijken' && gemeente) {
    const wijken = await getWijkenByGemeente(gemeente)
    return NextResponse.json({ wijken })
  }

  return NextResponse.json({ error: 'Geef type parameter op' }, { status: 400 })
}
