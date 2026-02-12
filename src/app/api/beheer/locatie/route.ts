import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllProvinces,
  getAllMunicipalities,
  getGemeentenByProvincie,
  getWoonplaatsenByGemeente,
} from '@/lib/pdok'

export const dynamic = 'force-dynamic'

// GET /api/beheer/locatie - Get location hierarchy data from PDOK
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'provincies', 'gemeenten', 'woonplaatsen'
  const provincie = searchParams.get('provincie')
  const gemeente = searchParams.get('gemeente')

  if (type === 'provincies') {
    const provincies = await getAllProvinces()
    return NextResponse.json({ provincies })
  }

  if (type === 'gemeenten') {
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

  return NextResponse.json({ error: 'Geef type parameter op' }, { status: 400 })
}
