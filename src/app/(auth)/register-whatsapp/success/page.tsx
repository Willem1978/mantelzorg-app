"use client"

import { GerAvatar } from "@/components/GerAvatar"
import Link from "next/link"

export default function RegisterWhatsAppSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header met Ger */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="lg" />
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-foreground">
              Gelukt!
            </h1>
            <p className="text-muted-foreground mt-1">
              Je account is aangemaakt
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <div className="ker-card text-center">
            {/* Success icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
              Je WhatsApp is gekoppeld!
            </h2>

            <p className="text-muted-foreground mb-6">
              Je kunt nu WhatsApp gebruiken om:
            </p>

            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <span className="text-foreground">De Balanstest doen</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🗺️</span>
                <span className="text-foreground">Hulp in de buurt zoeken</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <span className="text-foreground">Je taken bekijken</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <span className="text-foreground">Je dashboard openen</span>
              </li>
            </ul>

            {/* WhatsApp terug knop */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-800 font-medium mb-2">
                Ga terug naar WhatsApp
              </p>
              <p className="text-sm text-green-700 mb-3">
                Typ <strong>menu</strong> om te beginnen
              </p>
            </div>

            <Link href="/dashboard" className="ker-btn ker-btn-primary w-full">
              Of bekijk je Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
