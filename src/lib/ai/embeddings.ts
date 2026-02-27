/**
 * Embedding service voor semantische zoek.
 *
 * Gebruikt OpenAI text-embedding-3-small (1536 dimensies).
 * Embeddings worden opgeslagen in PostgreSQL via pgvector.
 */

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
const EMBEDDING_DIMENSIONS = 1536
const OPENAI_API_URL = "https://api.openai.com/v1/embeddings"

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error("OPENAI_API_KEY is niet ingesteld. Voeg deze toe aan je .env.local")
  }
  return key
}

/**
 * Genereer een embedding voor een enkele tekst.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.trim()
  if (!input) {
    throw new Error("Lege tekst kan niet worden geëmbed")
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI embedding fout (${response.status}): ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding as number[]
}

/**
 * Genereer embeddings voor meerdere teksten in één API call.
 * OpenAI ondersteunt batch-embedding (max ~8000 tokens per input).
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const inputs = texts.map((t) => t.trim()).filter(Boolean)
  if (inputs.length === 0) return []

  // OpenAI batch limit: ~2048 inputs per request
  const BATCH_SIZE = 100
  const allEmbeddings: number[][] = []

  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE)

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI embedding batch fout (${response.status}): ${error}`)
    }

    const data = await response.json()
    // Sorteer op index om volgorde te garanderen
    const sorted = data.data.sort(
      (a: { index: number }, b: { index: number }) => a.index - b.index
    )
    allEmbeddings.push(...sorted.map((d: { embedding: number[] }) => d.embedding))
  }

  return allEmbeddings
}

/**
 * Maak een tekst-representatie van een Artikel voor embedding.
 * Combineert titel, beschrijving en inhoud tot één doorzoekbare tekst.
 */
export function artikelToEmbeddingText(artikel: {
  titel: string
  beschrijving: string
  inhoud?: string | null
  categorie?: string | null
}): string {
  const parts = [artikel.titel, artikel.beschrijving]
  if (artikel.inhoud) {
    // Strip HTML tags als die er zijn
    const plainText = artikel.inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    // Beperk tot ~1000 chars om token-limiet niet te overschrijden
    parts.push(plainText.slice(0, 1000))
  }
  if (artikel.categorie) {
    parts.push(`Categorie: ${artikel.categorie}`)
  }
  return parts.filter(Boolean).join(". ")
}

/**
 * Maak een tekst-representatie van een Zorgorganisatie voor embedding.
 * Combineert alle relevante velden tot één doorzoekbare tekst.
 */
export function zorgorganisatieToEmbeddingText(org: {
  naam: string
  beschrijving?: string | null
  dienst?: string | null
  soortHulp?: string | null
  onderdeelTest?: string | null
  gemeente?: string | null
  doelgroep?: string | null
}): string {
  const parts = [org.naam]
  if (org.dienst) parts.push(org.dienst)
  if (org.beschrijving) parts.push(org.beschrijving)
  if (org.soortHulp) parts.push(`Soort hulp: ${org.soortHulp}`)
  if (org.onderdeelTest) parts.push(`Categorie: ${org.onderdeelTest}`)
  if (org.gemeente) parts.push(`Gemeente: ${org.gemeente}`)
  if (org.doelgroep) parts.push(`Doelgroep: ${org.doelgroep}`)
  return parts.filter(Boolean).join(". ")
}

/**
 * Converteer een number[] embedding naar een PostgreSQL vector string.
 * Format: [0.1,0.2,0.3,...] → gebruikt in $executeRawUnsafe
 */
export function toVectorSql(embedding: number[]): string {
  return `[${embedding.join(",")}]`
}

export { EMBEDDING_DIMENSIONS }
