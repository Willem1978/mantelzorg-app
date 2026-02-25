# Architectuur Verbetervoorstel - Mantelzorg App

> **Datum:** 25 februari 2026
> **Scope:** Volledige codebase-analyse van de Next.js/Prisma/Supabase applicatie
> **Doel:** Concrete, prioriteit-geordende verbetervoorstellen met codevoorbeelden

---

## Inhoudsopgave

1. [Samenvatting](#1-samenvatting)
2. [Kritiek - Input Validatie](#2-kritiek---input-validatie-ontbreekt-bij-45-routes)
3. [Kritiek - Caching Strategie](#3-kritiek---geen-caching-strategie-9496-routes)
4. [Kritiek - In-Memory WhatsApp Sessies](#4-kritiek---in-memory-whatsapp-sessies)
5. [Kritiek - Test Coverage](#5-kritiek---zero-api-test-coverage)
6. [Hoog - Service Layer Abstractie](#6-hoog---service-layer-abstractie-ontbreekt)
7. [Hoog - Inconsistente Error Responses](#7-hoog---inconsistente-error-responses)
8. [Hoog - Database Indexes](#8-hoog---ontbrekende-database-indexes)
9. [Medium - Type Safety (as any)](#9-medium---type-safety-as-any-verwijderen)
10. [Medium - N+1 Queries en Paginatie](#10-medium---n1-queries-en-ontbrekende-paginatie)
11. [Medium - Build Script Risico's](#11-medium---build-script-risicos)
12. [Laag - Ontbrekende Cascade Deletes](#12-laag---ontbrekende-cascade-deletes)
13. [Implementatie Roadmap](#13-implementatie-roadmap)

---

## 1. Samenvatting

| # | Probleem | Ernst | Bestanden | Impact |
|---|----------|-------|-----------|--------|
| 2 | Geen input validatie bij 45+ routes | **Kritiek** | 45+ API routes | SQL injection, data corruptie |
| 3 | Geen caching (94/96 routes force-dynamic) | **Kritiek** | 94 API routes | Performance, kosten |
| 4 | In-memory WhatsApp sessies | **Kritiek** | `whatsapp-session.ts` | Data verlies bij restart |
| 5 | Geen API tests | **Kritiek** | 96 API routes | Regressie risico |
| 6 | Geen service layer | **Hoog** | 80+ API routes | Moeilijk testbaar, duplicatie |
| 7 | Inconsistente error responses | **Hoog** | 20+ routes | Slechte DX, moeilijk debuggen |
| 8 | Ontbrekende database indexes | **Hoog** | 3 Prisma models | Trage queries |
| 9 | 26x `as any` type casts | **Medium** | 11 bestanden | Type safety verlies |
| 10 | N+1 queries, ontbrekende paginatie | **Medium** | 10+ routes | Performance |
| 11 | Gevaarlijk build script | **Medium** | `scripts/build.js` | Data verlies mogelijk |
| 12 | Ontbrekende cascade deletes | **Laag** | BelastbaarheidTest | Orphaned records |

---

## 2. Kritiek - Input Validatie ontbreekt bij 45+ routes

### Probleem

Slechts ~50 van de 96 API routes gebruiken Zod-validatie. De overige routes parsen direct `request.json()` en vertrouwen op handmatige controles of doen helemaal geen validatie. Dit opent de deur voor onverwachte data, type-fouten, en potentieel kwaadaardige input.

### Huidige situatie

**`src/lib/validations.ts`** bevat alleen:
- `loginSchema` - auth
- `registerSchema` - auth
- `forgotPasswordSchema` - auth
- `resetPasswordSchema` - auth
- `artikelSchema` - beheer
- `hulpbronSchema` - beheer
- `checkInSchema` - check-in

**Ontbrekende schemas voor:**
- Alle `gemeente/*` routes (demografie, trends, rapportages, hulpbronnen)
- Alle `beheer/gebruikers/*` routes
- `intake/route.ts` - handmatige validatie
- `belastbaarheidstest/route.ts`
- `balanstest/[id]/route.ts`
- `check-in/route.ts` (deels)
- Alle `seed/*` routes
- WhatsApp webhook handlers

### Voorbeeld: Geen validatie in intake route

**`src/app/api/intake/route.ts:29-36`** - Handmatige check zonder schema:
```typescript
// HUIDIG - onveilig
const body: IntakeBody = await request.json()  // TypeScript type is geen runtime check!

if (!body.answers || Object.keys(body.answers).length === 0) {
  return NextResponse.json(
    { error: "Geen antwoorden ontvangen" },
    { status: 400 }
  )
}
```

### Voorgestelde oplossing

#### Stap 1: Voeg ontbrekende Zod schemas toe aan `src/lib/validations.ts`

```typescript
// --- Intake schema ---
export const intakeSchema = z.object({
  answers: z.record(z.string(), z.string()).refine(
    (val) => Object.keys(val).length > 0,
    "Minimaal 1 antwoord is verplicht"
  ),
})

// --- Belastbaarheidstest schema ---
export const belastbaarheidTestSchema = z.object({
  voornaam: z.string().min(1, "Voornaam is verplicht"),
  email: z.string().email("Vul een geldig e-mailadres in"),
  postcode: z.string().regex(/^\d{4}\s?[A-Za-z]{2}$/, "Ongeldige postcode").optional(),
  huisnummer: z.string().optional(),
  antwoorden: z.record(z.string(), z.string()),
  taakSelecties: z.array(z.object({
    taakId: z.string(),
    taakNaam: z.string(),
    urenPerWeek: z.number().int().min(0).optional(),
    moeilijkheid: z.enum(["MAKKELIJK", "GEMIDDELD", "MOEILIJK", "ZEER_MOEILIJK"]).optional(),
  })).optional(),
})

// --- Gemeente filter schema (herbruikbaar) ---
export const gemeenteFilterSchema = z.object({
  periode: z.enum(["week", "maand", "kwartaal", "jaar", "alles"]).default("alles"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// --- Beheer gebruiker update schema ---
export const gebruikerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["CAREGIVER", "BUDDY", "ORG_MEMBER", "ORG_ADMIN", "GEMEENTE_ADMIN", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  adminNotities: z.string().optional(),
})
```

#### Stap 2: Gebruik `validateBody()` helper in alle routes

```typescript
// NIEUW - veilig
import { intakeSchema, validateBody } from "@/lib/validations"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = validateBody(body, intakeSchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  const { answers } = validation.data
  // ... rest van de logica
}
```

### Betrokken bestanden (top prioriteit)

| Route | Reden |
|-------|-------|
| `src/app/api/intake/route.ts` | Gebruikersinvoer, geen schema |
| `src/app/api/belastbaarheidstest/route.ts` | Grote form, geen schema |
| `src/app/api/balanstest/[id]/route.ts` | Gebruikersinvoer |
| `src/app/api/check-in/route.ts` | Gebruikersinvoer |
| `src/app/api/beheer/gebruikers/[id]/route.ts` | Admin operaties |
| `src/app/api/beheer/hulpbronnen/route.ts` | CRUD operaties |
| `src/app/api/gemeente/*/route.ts` (alle) | Filterparameters |

---

## 3. Kritiek - Geen caching strategie (94/96 routes)

### Probleem

94 van de 96 API routes gebruiken `export const dynamic = 'force-dynamic'`, wat **alle** Next.js caching volledig uitschakelt. Alleen `site-settings` en `auth/[...nextauth]` hebben cache headers. Dit betekent dat elke request een verse database-query triggert, ook voor data die zelden verandert.

### Impact

- Onnodig hoge database-belasting (elke pageview = verse query)
- Langzamere response times
- Hogere Supabase-kosten bij schalen
- Slechte gebruikerservaring door trage laadtijden

### Huidige situatie

```typescript
// Staat bovenaan in 94 van 96 routes:
export const dynamic = 'force-dynamic'
```

### Voorgestelde oplossing per route-categorie

#### Categorie A: Statisch/Zelden verandert - Cache agressief

Routes waarvan de data zelden wijzigt:

```typescript
// src/app/api/site-settings/route.ts - GOED (al gecached)
// Toepassen op vergelijkbare routes:

// src/app/api/content/* routes (artikelen, categorieën)
export const revalidate = 3600 // 1 uur cache, revalidate on demand

export async function GET() {
  const data = await prisma.artikel.findMany({ where: { isActief: true } })
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
```

**Routes voor categorie A:**
- `src/app/api/content/*` - Content categorieën, zorgtaken, formulier opties
- `src/app/api/artikelen/*` - Gepubliceerde artikelen
- `src/app/api/hulpbronnen/zoeken/*` - Zorgorganisaties (veranderen zelden)

#### Categorie B: Per-gebruiker data - Korte cache met revalidatie

```typescript
// src/app/api/dashboard/route.ts
// Verwijder: export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  // ... fetch data
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
```

**Routes voor categorie B:**
- `src/app/api/dashboard/route.ts`
- `src/app/api/profiel/route.ts`
- `src/app/api/notificaties/route.ts`

#### Categorie C: Gemeente statistieken - Medium cache

```typescript
// src/app/api/gemeente/demografie/route.ts
// Statistieken veranderen pas als er nieuwe tests zijn

export async function GET() {
  // ... fetch data
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
```

**Routes voor categorie C:**
- `src/app/api/gemeente/demografie/route.ts`
- `src/app/api/gemeente/trends/route.ts`
- `src/app/api/gemeente/rapportages/route.ts`

#### Categorie D: Moet altijd vers zijn - Houd force-dynamic

```typescript
// Deze routes moeten altijd vers zijn:
export const dynamic = 'force-dynamic'
```

**Routes voor categorie D:**
- `src/app/api/auth/*` - Authenticatie
- `src/app/api/whatsapp/*` - Webhook handlers
- `src/app/api/beheer/*/route.ts` - Admin mutaties (POST/PUT/DELETE)

#### Optioneel: On-demand revalidatie bij mutaties

```typescript
// In een POST/PUT/DELETE handler die data wijzigt:
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  // ... create/update data
  revalidatePath('/api/artikelen')  // Invalideer de GET cache
  return NextResponse.json({ success: true })
}
```

---

## 4. Kritiek - In-Memory WhatsApp Sessies

### Probleem

**`src/lib/whatsapp-session.ts:112-115`** slaat alle WhatsApp-sessies op in JavaScript `Map` objecten:

```typescript
const sessions = new Map<string, TestSession>()
const onboardingSessions = new Map<string, OnboardingSession>()
const hulpSessions = new Map<string, HulpSession>()
```

Dit is problematisch omdat:
1. **Sessies verdwijnen** bij elke server restart/deploy
2. **Geen support** voor meerdere server instances (Vercel serverless functions)
3. **Geen expiratie** - sessies groeien oneindig (memory leak)
4. **Geen beveiliging** - geen session validation of cleanup

### Impact

- Gebruikers verliezen WhatsApp-flows halverwege bij deploys
- In serverless (Vercel) werkt het per definitie niet betrouwbaar (elke invocation kan een nieuwe instance zijn)
- Potentieel memory leak op lange termijn

### Voorgestelde oplossing: Database-backed sessies

#### Stap 1: Voeg een WhatsAppSession model toe aan Prisma schema

```prisma
model WhatsAppSession {
  id          String   @id @default(cuid())
  phoneNumber String
  type        WhatsAppSessionType
  data        Json     // Sessie state (answers, step, etc.)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([phoneNumber, type])
  @@index([expiresAt])  // Voor cleanup queries
}

enum WhatsAppSessionType {
  TEST
  ONBOARDING
  HULP
}
```

#### Stap 2: Refactor session functies

```typescript
// src/lib/whatsapp-session.ts - NIEUW

import { prisma } from "@/lib/prisma"

const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minuten

export async function getTestSession(phoneNumber: string): Promise<TestSession | null> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { phoneNumber_type: { phoneNumber, type: "TEST" } },
  })
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.whatsAppSession.delete({ where: { id: session.id } })
    }
    return null
  }
  return session.data as TestSession
}

export async function startTestSession(phoneNumber: string, userId: string): Promise<void> {
  const data: TestSession = {
    userId,
    currentStep: 'intro',
    currentQuestion: 0,
    answers: {},
    selectedTasks: [],
    currentTaskIndex: 0,
    taskDetails: {},
    startedAt: new Date(),
  }
  await prisma.whatsAppSession.upsert({
    where: { phoneNumber_type: { phoneNumber, type: "TEST" } },
    create: {
      phoneNumber,
      type: "TEST",
      data: data as any,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
    update: {
      data: data as any,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  })
}

export async function updateTestSession(
  phoneNumber: string,
  updates: Partial<TestSession>
): Promise<void> {
  const current = await getTestSession(phoneNumber)
  if (!current) return
  await prisma.whatsAppSession.update({
    where: { phoneNumber_type: { phoneNumber, type: "TEST" } },
    data: {
      data: { ...current, ...updates } as any,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS), // Verleng TTL
    },
  })
}
```

#### Stap 3: Periodieke cleanup (optioneel)

```typescript
// src/app/api/cron/cleanup-sessions/route.ts
export async function GET() {
  const deleted = await prisma.whatsAppSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return NextResponse.json({ deleted: deleted.count })
}
```

---

## 5. Kritiek - Zero API Test Coverage

### Probleem

Er zijn slechts 3 testbestanden, allen voor lib utilities:
- `src/lib/__tests__/validations.test.ts` (138 regels)
- `src/lib/__tests__/rate-limit.test.ts` (~30 regels)
- `src/lib/__tests__/advies.test.ts`

**Geen enkele API route is getest.** Met 96 routes is dit een groot regressierisico.

### Voorgestelde oplossing: Gefaseerde testopzet

#### Stap 1: Test-infrastructure (eenmalig)

Maak een test helper voor API routes:

```typescript
// src/lib/__tests__/helpers/api-test-utils.ts
import { prisma } from "@/lib/prisma"

// Mock de auth() functie
export function mockAuth(user: { id: string; role: string; [key: string]: any } | null) {
  jest.mock("@/lib/auth", () => ({
    auth: jest.fn().mockResolvedValue(
      user ? { user } : null
    ),
  }))
}

// Maak een NextRequest mock
export function createMockRequest(
  method: string,
  body?: any,
  searchParams?: Record<string, string>
): Request {
  const url = new URL("http://localhost:3000/api/test")
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// Database cleanup helper
export async function cleanupTestData() {
  // Verwijder testdata in de juiste volgorde (foreign keys)
  await prisma.intakeResponse.deleteMany({})
  await prisma.belastbaarheidAntwoord.deleteMany({})
  await prisma.belastbaarheidTest.deleteMany({})
  await prisma.caregiver.deleteMany({})
  await prisma.user.deleteMany({})
}
```

#### Stap 2: Prioriteer tests voor kritieke routes

Begin met de routes die het meest impact hebben:

```typescript
// src/app/api/intake/__tests__/route.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { POST, GET } from "../route"
import { createMockRequest, mockAuth, cleanupTestData } from "@/lib/__tests__/helpers/api-test-utils"

describe("POST /api/intake", () => {
  beforeEach(() => cleanupTestData())
  afterEach(() => cleanupTestData())

  it("retourneert 401 zonder sessie", async () => {
    mockAuth(null)
    const req = createMockRequest("POST", { answers: { q1: "ja" } })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it("retourneert 400 bij lege answers", async () => {
    mockAuth({ id: "user1", role: "CAREGIVER" })
    const req = createMockRequest("POST", { answers: {} })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it("slaat intake op en markeert als completed", async () => {
    // ... setup testdata, run POST, verify database state
  })
})
```

#### Stap 3: Test Coverage targets

| Fase | Routes | Deadline suggestie |
|------|--------|--------------------|
| **Fase 1** | Auth routes (login, register, reset) | Week 1 |
| **Fase 2** | Intake, belastbaarheidstest, check-in | Week 2 |
| **Fase 3** | Dashboard, profiel | Week 3 |
| **Fase 4** | Beheer CRUD routes | Week 4 |
| **Fase 5** | Gemeente statistiek routes | Week 5 |
| **Fase 6** | WhatsApp webhook handlers | Week 6 |

---

## 6. Hoog - Service Layer Abstractie ontbreekt

### Probleem

80+ van de 96 API routes roepen Prisma direct aan. Er is geen service-laag tussen de route handler en de database. Dit betekent:
- **Duplicatie**: Dezelfde query-logica herhaalt zich in meerdere routes
- **Moeilijk testbaar**: Routes zijn direct gekoppeld aan de database
- **Geen hergebruik**: Business logica zit vast in HTTP handlers

### Huidige (slechte) situatie

Er bestaat al een kleine service-laag in `src/lib/dashboard/`:
- `hulpbronnen.ts` (190 regels)
- `artikelen.ts` (50 regels)
- `advies.ts` (149 regels)
- `mijlpalen.ts` (82 regels)

Maar deze patronen worden niet breder toegepast.

### Voorgestelde oplossing: Service modules per domein

#### Stap 1: Maak service modules aan

```
src/lib/services/
  caregiver.service.ts     - Caregiver CRUD + profiel logica
  intake.service.ts        - Intake opslag en ophalen
  belastbaarheid.service.ts - Test logica, score berekening
  gemeente.service.ts      - Gemeente statistieken
  beheer.service.ts        - Admin operaties
  notificatie.service.ts   - Notificatie CRUD
```

#### Stap 2: Voorbeeld service implementatie

```typescript
// src/lib/services/intake.service.ts
import { prisma } from "@/lib/prisma"

const SCORE_MAP: Record<string, number> = {
  helemaal_mee_eens: 4,
  mee_eens: 3,
  niet_mee_eens: 2,
  helemaal_niet_mee_eens: 1,
}

export async function saveIntakeResponses(
  userId: string,
  answers: Record<string, string>
) {
  const caregiver = await prisma.caregiver.findUnique({
    where: { userId },
  })
  if (!caregiver) {
    throw new Error("CAREGIVER_NOT_FOUND")
  }

  const intakeResponses = Object.entries(answers).map(
    ([questionId, value]) => ({
      questionId,
      value,
      score: SCORE_MAP[value] ?? null,
    })
  )

  await prisma.$transaction(async (tx) => {
    await tx.intakeResponse.deleteMany({ where: { caregiverId: caregiver.id } })
    for (const response of intakeResponses) {
      // ... question lookup + create logic (verplaatst uit route)
      await tx.intakeResponse.create({
        data: {
          caregiverId: caregiver.id,
          questionId: response.questionId,
          value: response.value,
          score: response.score,
        },
      })
    }
    await tx.caregiver.update({
      where: { id: caregiver.id },
      data: { intakeCompleted: true, onboardedAt: new Date() },
    })
  })
}

export async function getIntakeResponses(userId: string) {
  const caregiver = await prisma.caregiver.findUnique({
    where: { userId },
    include: {
      intakeResponses: {
        include: { question: { include: { category: true } } },
      },
    },
  })
  if (!caregiver) throw new Error("CAREGIVER_NOT_FOUND")
  // ... groupering logica
  return { intakeCompleted: caregiver.intakeCompleted, categories: /* ... */ }
}
```

#### Stap 3: Slanke route handler

```typescript
// src/app/api/intake/route.ts - NA REFACTOR
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { intakeSchema, validateBody } from "@/lib/validations"
import { saveIntakeResponses, getIntakeResponses } from "@/lib/services/intake.service"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateBody(body, intakeSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await saveIntakeResponses(session.user.id, validation.data.answers)
    return NextResponse.json({ success: true, message: "Intake opgeslagen" })
  } catch (error: any) {
    if (error.message === "CAREGIVER_NOT_FOUND") {
      return NextResponse.json({ error: "Geen profiel gevonden" }, { status: 404 })
    }
    console.error("Intake save error:", error)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
```

---

## 7. Hoog - Inconsistente Error Responses

### Probleem

Er zijn minstens 4 verschillende error-response formats in gebruik:

| Pattern | Voorbeeld | Voorkomt in |
|---------|-----------|-------------|
| `{ error: "..." }` | `{ error: "Niet gevonden" }` | 80+ routes |
| `{ message: "..." }` | `{ message: "Fout opgetreden" }` | 5-10 routes |
| `{ bericht: "..." }` | gemeente routes met k-anonimiteit | 3+ routes |
| `{ error: variabele }` | `{ error: error.message }` | 5+ routes (lekt interne details) |

### Voorgestelde oplossing: Gestandaardiseerde error response helper

#### Stap 1: Maak een error response utility

```typescript
// src/lib/api-response.ts
import { NextResponse } from "next/server"

interface ApiError {
  error: string
  code?: string
  details?: Record<string, string>
}

export function apiError(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status }
  )
}

// Veelgebruikte errors als shortcuts
export const ApiErrors = {
  unauthorized: () => apiError("Niet ingelogd", 401, "UNAUTHORIZED"),
  forbidden: () => apiError("Geen toegang", 403, "FORBIDDEN"),
  notFound: (entity = "Resource") => apiError(`${entity} niet gevonden`, 404, "NOT_FOUND"),
  badRequest: (message: string) => apiError(message, 400, "BAD_REQUEST"),
  internal: (logError?: unknown) => {
    if (logError) console.error("Internal error:", logError)
    return apiError("Er ging iets mis", 500, "INTERNAL_ERROR")
  },
} as const

// Success response helper
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
```

#### Stap 2: Migreer routes stapsgewijs

```typescript
// VOOR:
return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })

// NA:
import { ApiErrors } from "@/lib/api-response"
return ApiErrors.unauthorized()
```

```typescript
// VOOR (lekt interne error details):
const msg = error instanceof Error ? error.message : String(error)
return NextResponse.json({ error: msg })

// NA:
return ApiErrors.internal(error)
```

---

## 8. Hoog - Ontbrekende Database Indexes

### Probleem

Meerdere kolommen die frequent gefilterd of gesorteerd worden, missen database-indexes. Dit leidt tot full table scans.

### Ontbrekende indexes geidentificeerd

#### 8.1 BelastbaarheidTest model (`prisma/schema.prisma:330-354`)

**Huidige indexes:** alleen `@@index([caregiverId])`

**Ontbrekend:**
```prisma
model BelastbaarheidTest {
  // ... bestaande velden

  @@index([caregiverId])
  @@index([gemeente])                    // TOEVOEGEN: filtered in gemeente/demografie, gemeente/trends
  @@index([isCompleted, gemeente])       // TOEVOEGEN: samengestelde index voor gemeente queries
  @@index([completedAt])                 // TOEVOEGEN: gesorteerd in trends/rapportages
}
```

**Query die profiteert** (`src/app/api/gemeente/demografie/route.ts:11-21`):
```typescript
const tests = await prisma.belastbaarheidTest.findMany({
  where: {
    isCompleted: true,
    gemeente: { equals: gemeenteNaam, mode: "insensitive" },  // FULL TABLE SCAN zonder index
  },
})
```

#### 8.2 Caregiver model (`prisma/schema.prisma:93-131`)

**Huidige indexes:** geen expliciete (alleen `@unique` op userId)

**Ontbrekend:**
```prisma
model Caregiver {
  // ... bestaande velden

  @@index([municipality])  // TOEVOEGEN: filtered in gemeente/demografie
}
```

**Query die profiteert** (`src/app/api/gemeente/demografie/route.ts:71-81`):
```typescript
const caregivers = await prisma.caregiver.findMany({
  where: {
    municipality: { equals: gemeenteNaam, mode: "insensitive" },  // FULL TABLE SCAN
  },
})
```

#### 8.3 MonthlyCheckIn model (`prisma/schema.prisma:168-186`)

**Ontbrekend:**
```prisma
model MonthlyCheckIn {
  // ... bestaande velden

  @@index([caregiverId, month])  // Bestaat al als @@unique, maar overweeg extra index op completedAt
}
```

### Implementatie

Voeg de indexes toe aan `prisma/schema.prisma` en run:
```bash
npx prisma db push
```

> **Let op:** Dit is een non-destructieve operatie. Indexes toevoegen verwijdert geen data.

---

## 9. Medium - Type Safety (as any) verwijderen

### Probleem

Er zijn 26 `as any` casts verspreid over 11 bestanden. De meest impactvolle zijn in:

1. **`src/middleware.ts`** - 4x `(session.user as any)?.role`
2. **`src/lib/auth.ts`** - 6x in JWT/session callbacks
3. **`src/app/gemeente/layout.tsx`** - 4x in layout component

### Voorgestelde oplossing: Extend NextAuth types

#### Stap 1: Maak of update type declarations

```typescript
// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      caregiverId: string | null
      gemeenteNaam: string | null
      gemeenteRollen: string[]
      sessionVersion: number
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    caregiverId: string | null
    gemeenteNaam: string | null
    gemeenteRollen: string[]
    sessionVersion: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    caregiverId: string | null
    gemeenteNaam: string | null
    gemeenteRollen: string[]
    sessionVersion: number
  }
}
```

#### Stap 2: Verwijder casts in auth.ts

```typescript
// src/lib/auth.ts - NA REFACTOR
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id!
      token.role = user.role          // Geen cast meer nodig
      token.caregiverId = user.caregiverId
      token.gemeenteNaam = user.gemeenteNaam
      token.gemeenteRollen = user.gemeenteRollen
      token.sessionVersion = user.sessionVersion
    }
    return token
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id
      session.user.role = token.role   // Geen cast meer nodig
      session.user.caregiverId = token.caregiverId
      session.user.gemeenteNaam = token.gemeenteNaam
      session.user.gemeenteRollen = token.gemeenteRollen
      session.user.sessionVersion = token.sessionVersion
    }
    return session
  },
},
```

#### Stap 3: Verwijder casts in middleware.ts

```typescript
// src/middleware.ts - NA REFACTOR
// VOOR:
const role = (session.user as any)?.role

// NA:
const role = session.user?.role  // TypeScript kent nu het type
```

---

## 10. Medium - N+1 Queries en ontbrekende paginatie

### Probleem

#### 10.1 Diepe nested includes (N+1 risico)

**`src/app/api/beheer/gebruikers/[id]/route.ts`** heeft een query met 4 niveaus diep nesting:

```typescript
const gebruiker = await prisma.user.findUnique({
  where: { id },
  include: {
    caregiver: {
      include: {
        belastbaarheidTests: { /* level 3 */ },
        monthlyCheckIns: { /* level 3 */ },
        helpRequests: { /* level 3 */ },
        buddyMatches: {
          include: {
            buddy: { select: { /* level 4 */ } }
          }
        }
      }
    },
    mantelBuddy: {
      include: {
        matches: {
          include: {
            caregiver: {
              select: {
                user: { select: { /* level 5! */ } }
              }
            }
          }
        }
      }
    }
  }
})
```

#### 10.2 Ontbrekende paginatie

**`src/app/api/gemeente/demografie/route.ts:71-81`** haalt ALLE mantelzorgers op zonder limiet:

```typescript
const caregivers = await prisma.caregiver.findMany({
  where: { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
  select: { dateOfBirth: true, careRecipient: true, neighborhood: true, careSince: true },
  // GEEN: take, skip
})
```

### Voorgestelde oplossing

#### 10.1 Splitsen van diepe queries

```typescript
// In plaats van 1 mega-query, splits in 2-3 gerichte queries:
const gebruiker = await prisma.user.findUnique({
  where: { id },
  include: { caregiver: true, mantelBuddy: true },
})

// Alleen als caregiver bestaat:
const recenteTests = gebruiker?.caregiver
  ? await prisma.belastbaarheidTest.findMany({
      where: { caregiverId: gebruiker.caregiver.id, isCompleted: true },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: { id: true, totaleBelastingScore: true, completedAt: true },
    })
  : []
```

#### 10.2 Cursor-based paginatie voor grote datasets

Voor de gemeente demografie route is aggregatie op database-niveau beter dan alles ophalen:

```typescript
// Gebruik Prisma groupBy of raw queries voor statistieken:
const leeftijdStats = await prisma.$queryRaw`
  SELECT
    CASE
      WHEN EXTRACT(YEAR FROM AGE(NOW(), "dateOfBirth")) BETWEEN 18 AND 30 THEN '18-30'
      WHEN EXTRACT(YEAR FROM AGE(NOW(), "dateOfBirth")) BETWEEN 31 AND 45 THEN '31-45'
      -- etc.
    END as leeftijdgroep,
    COUNT(*) as aantal
  FROM "Caregiver"
  WHERE LOWER(municipality) = LOWER(${gemeenteNaam})
  GROUP BY leeftijdgroep
`
```

---

## 11. Medium - Build Script Risico's

### Probleem

**`scripts/build.js:21`** gebruikt `--accept-data-loss`:

```javascript
execSync('npx prisma db push --skip-generate --accept-data-loss', {
  stdio: 'inherit', env: process.env
});
```

Dit kan kolommen of tabellen verwijderen als het schema gewijzigd is.

### Verdere problemen

1. **Geen error handling** voor `prisma generate` (regel 15) - als dit faalt, bouwt Next.js met een verouderde client
2. **Hardcoded Supabase poort-mapping** (regel 6-11) - breekt bij andere database setups

### Voorgestelde oplossing

```javascript
// scripts/build.js - VERBETERD
const { execSync } = require('child_process');

// DIRECT_URL afleiden als niet gezet
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL
    .replace(':6543/', ':5432/')
    .replace('&pgbouncer=true', '')
    .replace('?pgbouncer=true&', '?')
    .replace('?pgbouncer=true', '');
  console.log('DIRECT_URL automatically set from DATABASE_URL');
}

// Stap 1: Genereer Prisma client (MOET slagen)
try {
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
} catch (e) {
  console.error('FATAL: Prisma client generation failed. Build aborted.');
  process.exit(1);  // Stop de build
}

// Stap 2: Schema sync (ZONDER --accept-data-loss)
try {
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit', env: process.env
  });
} catch (e) {
  console.warn('Warning: prisma db push failed. Schema should be managed locally.');
  // Niet fataal - schema kan lokaal beheerd worden
}

// Stap 3: Build Next.js
execSync('npx next build', { stdio: 'inherit', env: process.env });
```

---

## 12. Laag - Ontbrekende Cascade Deletes

### Probleem

**BelastbaarheidTest** (`prisma/schema.prisma:350`) mist `onDelete` behavior:

```prisma
caregiver Caregiver? @relation(fields: [caregiverId], references: [id])
// Zou moeten zijn:
caregiver Caregiver? @relation(fields: [caregiverId], references: [id], onDelete: SetNull)
```

Omdat `caregiverId` nullable is (`String?`), is `SetNull` de juiste keuze hier - als een caregiver verwijderd wordt, blijven de testresultaten bewaard voor statistieken maar verliezen ze de koppeling.

### Voorgestelde fix

```prisma
model BelastbaarheidTest {
  // ...
  caregiver Caregiver? @relation(fields: [caregiverId], references: [id], onDelete: SetNull)
  // ...
}
```

Vergelijkbaar voor **BuddyBeoordeling** (`prisma/schema.prisma:670`):
```prisma
// HUIDIG:
caregiver Caregiver? @relation(fields: [caregiverId], references: [id])

// VERBETERD:
caregiver Caregiver? @relation(fields: [caregiverId], references: [id], onDelete: SetNull)
```

---

## 13. Implementatie Roadmap

### Fase 1: Quick Wins (Week 1-2)

| Taak | Impact | Effort |
|------|--------|--------|
| Database indexes toevoegen | Hoog | Laag |
| NextAuth types uitbreiden (as any weg) | Medium | Laag |
| `api-response.ts` helper aanmaken | Medium | Laag |
| Build script fixen (geen --accept-data-loss) | Medium | Laag |
| Cascade deletes toevoegen | Laag | Laag |

### Fase 2: Validatie & Errors (Week 3-4)

| Taak | Impact | Effort |
|------|--------|--------|
| Ontbrekende Zod schemas schrijven | Hoog | Medium |
| Validatie toepassen in alle routes | Hoog | Medium |
| Error responses standaardiseren | Medium | Medium |

### Fase 3: Architectuur (Week 5-8)

| Taak | Impact | Effort |
|------|--------|--------|
| Service layer modules aanmaken | Hoog | Hoog |
| Routes refactoren naar services | Hoog | Hoog |
| Caching strategie implementeren | Hoog | Medium |
| WhatsApp sessies naar database | Hoog | Medium |

### Fase 4: Kwaliteitsborging (Week 9-12)

| Taak | Impact | Effort |
|------|--------|--------|
| Test helpers en fixtures opzetten | Hoog | Medium |
| Tests voor kritieke API routes | Hoog | Hoog |
| N+1 query optimalisaties | Medium | Medium |
| Paginatie toevoegen waar nodig | Medium | Laag |

---

> **Opmerking:** Dit document is gegenereerd op basis van een volledige codebase-analyse van 96 API routes, het Prisma schema (1059 regels), middleware, service bestanden, en de build-configuratie. Alle bestandspaden en regelnummers zijn geverifieerd tegen de huidige codebase.
