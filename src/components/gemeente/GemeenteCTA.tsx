"use client"

// ============================================
// GEMEENTE CTA SECTION (Iteratie 5.2)
// ============================================

const COLORS = {
  primary: "#2D1B69",
  accent: "#E5A825",
  background: "#F8F0F5",
}

interface GemeenteCTAProps {
  gemeenteNaam: string
  aantalMantelzorgers: number
}

export function GemeenteCTA({ gemeenteNaam, aantalMantelzorgers }: GemeenteCTAProps) {
  const mailtoInfopakket = `mailto:info@mantelbuddy.nl?subject=${encodeURIComponent(
    `Informatiepakket aanvragen — ${gemeenteNaam}`
  )}&body=${encodeURIComponent(
    `Beste MantelBuddy team,\n\nGraag ontvang ik een informatiepakket voor gemeente ${gemeenteNaam}.\n\nMet vriendelijke groet`
  )}`

  const mailtoBijeenkomst = `mailto:info@mantelbuddy.nl?subject=${encodeURIComponent(
    `Informatiebijeenkomst plannen — ${gemeenteNaam}`
  )}&body=${encodeURIComponent(
    `Beste MantelBuddy team,\n\nGraag zou ik een informatiebijeenkomst willen plannen voor gemeente ${gemeenteNaam}.\n\nVoorkeursperiode: \nVerwacht aantal deelnemers: \n\nMet vriendelijke groet`
  )}`

  return (
    <div
      className="rounded-2xl border-2 p-6 sm:p-8"
      style={{
        borderColor: `${COLORS.primary}20`,
        backgroundColor: COLORS.background,
      }}
    >
      {/* Benchmark stat */}
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
          MantelBuddy in uw gemeente
        </p>
        <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>
          {aantalMantelzorgers}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          mantelzorgers in <span className="font-semibold">{gemeenteNaam}</span> gebruiken MantelBuddy
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-6" />

      {/* CTA Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={mailtoInfopakket}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: COLORS.primary }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Stuur informatiepakket
        </a>

        <a
          href={mailtoBijeenkomst}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold border-2 transition-all hover:opacity-80"
          style={{
            borderColor: COLORS.accent,
            color: COLORS.primary,
            backgroundColor: `${COLORS.accent}15`,
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Plan informatiebijeenkomst
        </a>
      </div>
    </div>
  )
}
