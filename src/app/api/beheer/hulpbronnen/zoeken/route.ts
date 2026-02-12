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
  bron?: string
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

  const results: ScrapedResult[] = []
  const errors: string[] = []

  // Zoek via meerdere bronnen parallel
  const searches = [
    searchDuckDuckGoAPI(gemeente || '', zoekterm || 'mantelzorg'),
    searchVindjeVoorziening(gemeente || ''),
    scrapeSocialeKaart(gemeente || '', zoekterm || 'mantelzorg'),
  ]

  const searchResults = await Promise.allSettled(searches)

  for (const result of searchResults) {
    if (result.status === 'fulfilled') {
      results.push(...result.value)
    } else {
      errors.push(result.reason?.message || 'Onbekende fout')
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

  return NextResponse.json({
    resultaten: unique,
    bronnen: errors.length > 0 ? { fouten: errors } : undefined,
  })
}

// DuckDuckGo Instant Answer API (JSON, more reliable than HTML scraping)
async function searchDuckDuckGoAPI(gemeente: string, zoekterm: string): Promise<ScrapedResult[]> {
  try {
    const queries = [
      `${zoekterm} ${gemeente} mantelzorg hulp`.trim(),
      `mantelzorgondersteuning ${gemeente}`.trim(),
      `thuiszorg ${gemeente}`.trim(),
    ]

    const allResults: ScrapedResult[] = []

    for (const query of queries) {
      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MantelBuddy/1.0; +https://mantelbuddy.nl)',
            'Accept': 'text/html',
            'Accept-Language': 'nl-NL,nl;q=0.9',
          },
          signal: AbortSignal.timeout(8000),
        }
      )

      if (!response.ok) continue

      const html = await response.text()

      // DuckDuckGo HTML uses various result container patterns
      // Try multiple parsing strategies
      const results = parseDuckDuckGoHTML(html, gemeente)
      allResults.push(...results)

      if (allResults.length >= 5) break // Genoeg resultaten
    }

    return allResults
  } catch (error) {
    console.error('DuckDuckGo search error:', error)
    return []
  }
}

function parseDuckDuckGoHTML(html: string, gemeente?: string): ScrapedResult[] {
  const results: ScrapedResult[] = []

  // Strategy 1: Classic result__body pattern
  const resultBlocks = html.split(/class="result[_\s]/)
  for (const block of resultBlocks.slice(1, 15)) {
    // Try multiple title patterns
    const titleMatch =
      block.match(/class="result__a"[^>]*>([^<]+)</) ||
      block.match(/class="result-link"[^>]*>([^<]+)</) ||
      block.match(/<a[^>]*class="[^"]*result[^"]*"[^>]*>([^<]+)</)

    const urlMatch =
      block.match(/href="(https?:\/\/[^"]+)"/) ||
      block.match(/href="([^"]*uddg=[^"]+)"/)

    const snippetMatch =
      block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\//) ||
      block.match(/class="result-snippet"[^>]*>([\s\S]*?)<\//)

    if (titleMatch && urlMatch) {
      let url = urlMatch[1]
      // Extract actual URL from DuckDuckGo redirect
      const actualUrlMatch = url.match(/uddg=([^&]+)/)
      if (actualUrlMatch) {
        url = decodeURIComponent(actualUrlMatch[1])
      }

      // Skip non-relevant results
      if (url.includes('wikipedia.org') || url.includes('youtube.com') || url.includes('facebook.com')) continue

      const naam = decodeHTMLEntities(titleMatch[1]).trim()
      const snippet = snippetMatch
        ? decodeHTMLEntities(snippetMatch[1].replace(/<[^>]+>/g, '')).trim()
        : ''

      if (naam) {
        results.push({
          naam,
          beschrijving: snippet.substring(0, 200),
          website: url,
          gemeente: gemeente || undefined,
          bron: 'DuckDuckGo',
        })
      }
    }
  }

  return results
}

// Vind Je Voorziening / Regelhulp.nl - overheids hulpbronnen
async function searchVindjeVoorziening(gemeente: string): Promise<ScrapedResult[]> {
  if (!gemeente) return []

  try {
    const encodedGemeente = encodeURIComponent(gemeente)
    const response = await fetch(
      `https://www.regelhulp.nl/onderwerpen/mantelzorg`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MantelBuddy/1.0)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!response.ok) return []

    const html = await response.text()
    const results: ScrapedResult[] = []

    // Parse regelhulp.nl content
    const linkPattern = /<a[^>]*href="(\/[^"]*mantelzorg[^"]*)"[^>]*>([^<]+)</gi
    let match
    while ((match = linkPattern.exec(html)) !== null && results.length < 5) {
      results.push({
        naam: decodeHTMLEntities(match[2]).trim(),
        beschrijving: `Informatie over mantelzorg via Regelhulp.nl`,
        website: `https://www.regelhulp.nl${match[1]}`,
        gemeente,
        bron: 'Regelhulp.nl',
      })
    }

    return results
  } catch (error) {
    console.error('Regelhulp search error:', error)
    return []
  }
}

// Sociale Kaart - zorg- en welzijnsorganisaties
async function scrapeSocialeKaart(gemeente: string, zoekterm: string): Promise<ScrapedResult[]> {
  try {
    const query = encodeURIComponent(`${zoekterm} ${gemeente}`.trim())
    const response = await fetch(
      `https://www.desocialekaart.nl/zoeken?q=${query}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MantelBuddy/1.0)',
          'Accept': 'text/html',
          'Accept-Language': 'nl-NL,nl;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!response.ok) return []

    const html = await response.text()
    const results: ScrapedResult[] = []

    // Try multiple parsing patterns (site may have changed structure)
    // Pattern 1: search-result class
    const pattern1 = /class="search-result[^"]*"[\s\S]*?<\/(?:article|div|li)>/gi
    let match1
    while ((match1 = pattern1.exec(html)) !== null && results.length < 8) {
      const card = match1[0]
      const nameMatch =
        card.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)</) ||
        card.match(/<h[23][^>]*>([^<]+)</)
      const descMatch = card.match(/class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\//)
      const linkMatch = card.match(/href="(\/[^"]+)"/)

      if (nameMatch) {
        results.push({
          naam: decodeHTMLEntities(nameMatch[1]).trim(),
          beschrijving: descMatch
            ? decodeHTMLEntities(descMatch[1].replace(/<[^>]+>/g, '')).trim().substring(0, 200)
            : '',
          website: linkMatch
            ? `https://www.desocialekaart.nl${linkMatch[1]}`
            : '',
          gemeente: gemeente || undefined,
          bron: 'De Sociale Kaart',
        })
      }
    }

    // Pattern 2: If pattern 1 found nothing, try broader approach
    if (results.length === 0) {
      const orgLinks = html.match(/href="(\/organisaties\/[^"]+)"[^>]*>([^<]+)</gi)
      if (orgLinks) {
        for (const link of orgLinks.slice(0, 8)) {
          const parts = link.match(/href="(\/organisaties\/[^"]+)"[^>]*>([^<]+)</)
          if (parts) {
            results.push({
              naam: decodeHTMLEntities(parts[2]).trim(),
              beschrijving: '',
              website: `https://www.desocialekaart.nl${parts[1]}`,
              gemeente: gemeente || undefined,
              bron: 'De Sociale Kaart',
            })
          }
        }
      }
    }

    return results
  } catch (error) {
    console.error('Sociale Kaart search error:', error)
    return []
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
}
