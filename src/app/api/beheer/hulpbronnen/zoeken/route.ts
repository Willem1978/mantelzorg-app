import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface ScrapedResult {
  naam: string
  beschrijving: string
  website: string
  telefoon?: string
  adres?: string
  gemeente?: string
}

// POST /api/beheer/hulpbronnen/zoeken - Search the web for hulpbronnen
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { gemeente, zoekterm } = await request.json()

  if (!zoekterm && !gemeente) {
    return NextResponse.json({ error: 'Geef een zoekterm of gemeente op' }, { status: 400 })
  }

  const query = zoekterm
    ? `${zoekterm} ${gemeente || ''} mantelzorg hulp`
    : `mantelzorg hulp ${gemeente}`

  const results: ScrapedResult[] = []

  // Zoek via meerdere bronnen
  const searches = [
    scrapeGoogleSearch(query, gemeente),
    scrapeSocialeKaart(gemeente || '', zoekterm || 'mantelzorg'),
  ]

  const searchResults = await Promise.allSettled(searches)

  for (const result of searchResults) {
    if (result.status === 'fulfilled') {
      results.push(...result.value)
    }
  }

  // Dedupliceer op website URL
  const seen = new Set<string>()
  const unique = results.filter((r) => {
    const key = r.website?.toLowerCase() || r.naam.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return NextResponse.json({ resultaten: unique })
}

async function scrapeGoogleSearch(query: string, gemeente?: string): Promise<ScrapedResult[]> {
  try {
    // Use DuckDuckGo HTML search as a free alternative
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodedQuery}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) return []

    const html = await response.text()
    const results: ScrapedResult[] = []

    // Parse search results from DuckDuckGo HTML
    const resultBlocks = html.split('class="result__body"')

    for (const block of resultBlocks.slice(1, 11)) { // Max 10 results
      const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)</)
      const urlMatch = block.match(/href="([^"]+)"/)
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\//)

      if (titleMatch && urlMatch) {
        let url = urlMatch[1]
        // DuckDuckGo uses redirect URLs, extract the actual URL
        const actualUrlMatch = url.match(/uddg=([^&]+)/)
        if (actualUrlMatch) {
          url = decodeURIComponent(actualUrlMatch[1])
        }

        // Filter: only include relevant Dutch care/support websites
        const naam = titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim()
        const snippet = snippetMatch
          ? snippetMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim()
          : ''

        // Skip obvious non-relevant results
        if (url.includes('wikipedia.org') || url.includes('youtube.com')) continue

        results.push({
          naam,
          beschrijving: snippet.substring(0, 200),
          website: url,
          gemeente: gemeente || undefined,
        })
      }
    }

    return results
  } catch (error) {
    console.error('DuckDuckGo search error:', error)
    return []
  }
}

async function scrapeSocialeKaart(gemeente: string, zoekterm: string): Promise<ScrapedResult[]> {
  try {
    // Zoek op de Sociale Kaart (openbare bron voor zorg- en welzijnsorganisaties)
    const query = encodeURIComponent(`${zoekterm} ${gemeente}`)
    const response = await fetch(
      `https://www.desocialekaart.nl/zoeken?q=${query}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    )

    if (!response.ok) return []

    const html = await response.text()
    const results: ScrapedResult[] = []

    // Extract organization cards from search results
    const cards = html.split('class="search-result"')

    for (const card of cards.slice(1, 8)) {
      const nameMatch = card.match(/class="search-result__title"[^>]*>([^<]+)</)
      const descMatch = card.match(/class="search-result__description"[^>]*>([\s\S]*?)<\//)
      const linkMatch = card.match(/href="(\/organisaties\/[^"]+)"/)

      if (nameMatch) {
        const naam = nameMatch[1].trim()
        const beschrijving = descMatch
          ? descMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 200)
          : ''

        results.push({
          naam,
          beschrijving,
          website: linkMatch
            ? `https://www.desocialekaart.nl${linkMatch[1]}`
            : '',
          gemeente: gemeente || undefined,
        })
      }
    }

    return results
  } catch (error) {
    console.error('Sociale Kaart search error:', error)
    return []
  }
}
