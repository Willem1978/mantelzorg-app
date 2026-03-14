/**
 * Script: Tag bestaande artikelen met ContentTags
 *
 * Matcht artikelen op basis van keywords in titel en beschrijving
 * met de beschikbare AANDOENING-, SITUATIE- en ONDERWERP-tags.
 *
 * Gebruik: npx tsx scripts/seed-artikel-tags.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Keyword-mapping: tag-slug → keywords die in titel/beschrijving voorkomen
const TAG_KEYWORDS: Record<string, string[]> = {
  // AANDOENING tags
  "dementie": ["dementie", "alzheimer", "geheugenproblemen", "vergeetachtig"],
  "kanker": ["kanker", "oncologie", "tumor", "chemo", "bestraling"],
  "cva-beroerte": ["cva", "beroerte", "herseninfarct", "tia"],
  "hartfalen": ["hartfalen", "hartziekten", "hart", "hartaanval"],
  "copd": ["copd", "longziekte", "longaandoening", "benauwdheid"],
  "diabetes": ["diabetes", "suikerziekte", "bloedsuiker", "insuline"],
  "psychisch": ["psychisch", "depressie", "angst", "ggz", "psychiatrisch", "mentaal"],
  "verstandelijke-beperking": ["verstandelijke beperking", "lvb", "downsyndroom"],
  "lichamelijke-beperking": ["lichamelijke beperking", "rolstoel", "mobiliteit"],
  "nah": ["nah", "hersenletsel", "traumatisch"],
  "ouderdom": ["ouderdom", "kwetsbaar", "vergrijzing", "senioren", "bejaarden"],
  "terminaal": ["terminaal", "palliatief", "palliatieve", "levenseinde", "uitvaart"],

  // SITUATIE tags
  "werkend": ["werk", "werkgever", "collega", "kantoor", "baan", "arbeids"],
  "jong": ["jong", "jongeren", "tiener", "student", "studie"],
  "op-afstand": ["afstand", "ver weg", "reizen", "andere stad"],
  "samenwonend": ["samenwonend", "inwonend", "samen wonen"],
  "met-kinderen": ["kinderen", "gezin", "opvoeding", "school"],
  "beginnend": ["beginnen", "start", "eerste keer", "net begonnen", "nieuwe mantelzorger"],
  "langdurig": ["langdurig", "jaren", "chronisch"],
  "intensief": ["intensief", "zwaar", "overbelast", "burn-out", "burnout"],
  "partner-zorg": ["partner", "echtgenoot", "echtgenote"],
  "ouder-zorg": ["ouder", "moeder", "vader", "ouders"],
  "rouwverwerking": ["rouw", "overlijden", "verlies", "afscheid"],
  "alleenstaand": ["alleenstaand", "alleen"],

  // ONDERWERP tags
  "financien": ["financ", "kosten", "geld", "vergoeding", "toelage", "budget"],
  "wmo-aanvragen": ["wmo", "gemeente", "aanvraag", "indicatie"],
  "pgb": ["pgb", "persoonsgebonden budget"],
  "medicatie": ["medicijn", "medicatie", "pillen", "apotheek"],
  "nachtrust": ["slaap", "nacht", "rust", "slapen", "insomnia"],
  "voeding": ["voeding", "eten", "maaltijd", "koken", "dieet"],
  "veiligheid-thuis": ["veiligheid", "valpreventie", "domotica", "alarm"],
  "dagbesteding": ["dagbesteding", "activiteiten", "hobby"],
  "vervoer": ["vervoer", "taxibus", "regiotaxi", "rijden"],
  "respijtzorg": ["respijt", "logeervoorziening", "vervanging", "adempauze"],
  "werk-zorg-balans": ["werk-zorg", "balans", "combineren"],
  "emotionele-steun": ["emotioneel", "steun", "luisterend oor", "lotgenoten", "praatgroep"],
}

async function main() {
  console.log("=== Artikelen taggen ===\n")

  // Haal alle actieve tags op
  const tags = await prisma.contentTag.findMany({
    where: { isActief: true },
    select: { id: true, slug: true, type: true, naam: true },
  })
  console.log(`${tags.length} tags gevonden`)

  const tagMap = new Map(tags.map((t) => [t.slug, t]))

  // Haal alle artikelen op
  const artikelen = await prisma.artikel.findMany({
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      artikelTags: { select: { tagId: true } },
    },
  })
  console.log(`${artikelen.length} artikelen gevonden`)

  let totalTagsAdded = 0
  let artikelenGetagd = 0

  for (const artikel of artikelen) {
    const text = `${artikel.titel || ""} ${artikel.beschrijving || ""}`.toLowerCase()
    const bestaandeTags = new Set(artikel.artikelTags.map((t) => t.tagId))
    const nieuweTags: string[] = []

    for (const [slug, keywords] of Object.entries(TAG_KEYWORDS)) {
      const tag = tagMap.get(slug)
      if (!tag) continue
      if (bestaandeTags.has(tag.id)) continue // al getagd

      const match = keywords.some((kw) => text.includes(kw.toLowerCase()))
      if (match) {
        nieuweTags.push(tag.id)
      }
    }

    if (nieuweTags.length > 0) {
      await prisma.artikelTag.createMany({
        data: nieuweTags.map((tagId) => ({
          artikelId: artikel.id,
          tagId,
        })),
        skipDuplicates: true,
      })

      const tagNamen = nieuweTags
        .map((id) => tags.find((t) => t.id === id)?.naam || id)
        .join(", ")
      console.log(`  + "${artikel.titel}" → ${nieuweTags.length} tags: ${tagNamen}`)
      totalTagsAdded += nieuweTags.length
      artikelenGetagd++
    }
  }

  console.log(`\n=== Klaar! ${totalTagsAdded} tags toegevoegd aan ${artikelenGetagd} artikelen ===`)
}

main()
  .catch((e) => {
    console.error("Fout:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
