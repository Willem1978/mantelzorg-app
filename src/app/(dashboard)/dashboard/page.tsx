"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"

interface TestStatus {
  hasTest: boolean
  score?: number
  niveau?: "LAAG" | "GEMIDDELD" | "HOOG"
  completedAt?: string
}

export default function DashboardPage() {
  const [testStatus, setTestStatus] = useState<TestStatus>({ hasTest: false })
  const [userName, setUserName] = useState("daar")

  useEffect(() => {
    const localResult = localStorage.getItem("belastbaarheidstest_result")
    if (localResult) {
      try {
        const parsed = JSON.parse(localResult)
        setTestStatus({
          hasTest: true,
          score: parsed.score,
          niveau: getBelastingNiveau(parsed.score),
          completedAt: parsed.completedAt,
        })
        if (parsed.gegevens?.naam) {
          setUserName(parsed.gegevens.naam.split(" ")[0])
        }
      } catch {
        // Negeer parse errors
      }
    }
  }, [])

  return (
    <div className="ker-page-content">
      {/* Header met Ger */}
      <div className="flex items-start gap-4 mb-6">
        <GerAvatar size="lg" />
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-foreground">
            Hoi {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Fijn dat je er bent. Hoe gaat het met je?
          </p>
        </div>
      </div>

      {/* Belastbaarheidstest - Hoofdfocus */}
      {!testStatus.hasTest ? (
        <Link href="/belastbaarheidstest" className="block mb-6">
          <div className="ker-card bg-primary text-primary-foreground hover:opacity-95 transition-opacity">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-xl">Doe de Balanstest</h2>
                <p className="text-primary-foreground/80 mt-1">
                  Ontdek hoe het met je gaat
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/rapport" className="block mb-6">
          <div className={cn(
            "ker-card transition-colors",
            testStatus.niveau === "LAAG" && "bg-[var(--accent-green-bg)]",
            testStatus.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)]",
            testStatus.niveau === "HOOG" && "bg-[var(--accent-red-bg)]"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0",
                testStatus.niveau === "LAAG" && "bg-[var(--emoticon-green)]",
                testStatus.niveau === "GEMIDDELD" && "bg-[var(--emoticon-yellow)]",
                testStatus.niveau === "HOOG" && "bg-[var(--emoticon-red)]"
              )}>
                {testStatus.score}
              </div>
              <div className="flex-1">
                <h2 className={cn(
                  "font-bold text-lg",
                  testStatus.niveau === "LAAG" && "text-[var(--accent-green)]",
                  testStatus.niveau === "GEMIDDELD" && "text-[var(--accent-amber)]",
                  testStatus.niveau === "HOOG" && "text-[var(--accent-red)]"
                )}>
                  {testStatus.niveau === "LAAG" && "Lage belasting"}
                  {testStatus.niveau === "GEMIDDELD" && "Gemiddelde belasting"}
                  {testStatus.niveau === "HOOG" && "Hoge belasting"}
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Bekijk je rapport →
                </p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Snelle acties */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
          Snel naar
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/check-in" className="block">
            <div className="ker-card flex flex-col items-center gap-2 py-5 hover:border-primary/50 transition-colors border-2 border-transparent">
              <div className="w-12 h-12 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                <span className="text-2xl">😊</span>
              </div>
              <span className="font-medium text-foreground text-sm">Check-in</span>
            </div>
          </Link>

          <Link href="/hulpvragen" className="block">
            <div className="ker-card flex flex-col items-center gap-2 py-5 hover:border-primary/50 transition-colors border-2 border-transparent">
              <div className="w-12 h-12 bg-[var(--accent-amber-bg)] rounded-full flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <span className="font-medium text-foreground text-sm">Hulp vinden</span>
            </div>
          </Link>

          <Link href="/agenda" className="block">
            <div className="ker-card flex flex-col items-center gap-2 py-5 hover:border-primary/50 transition-colors border-2 border-transparent">
              <div className="w-12 h-12 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <span className="font-medium text-foreground text-sm">Agenda</span>
            </div>
          </Link>

          <Link href="/belastbaarheidstest" className="block">
            <div className="ker-card flex flex-col items-center gap-2 py-5 hover:border-primary/50 transition-colors border-2 border-transparent">
              <div className="w-12 h-12 bg-[var(--accent-red-bg)] rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <span className="font-medium text-foreground text-sm">Balanstest</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Tips */}
      {testStatus.hasTest && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
            Tips voor jou
          </h2>
          <div className="space-y-3">
            <div className="ker-card bg-muted">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-lg">💡</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Neem elke dag even rust</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Al is het maar 15 minuten voor jezelf
                  </p>
                </div>
              </div>
            </div>

            <div className="ker-card bg-muted">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-lg">💡</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Vraag om hulp</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Deel taken met familie of vrienden
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bemoediging */}
      <div className="text-center py-6">
        <p className="text-muted-foreground font-medium text-lg">
          Je doet het goed 💜
        </p>
      </div>
    </div>
  )
}

function getBelastingNiveau(score: number): "LAAG" | "GEMIDDELD" | "HOOG" {
  if (score <= 6) return "LAAG"
  if (score <= 12) return "GEMIDDELD"
  return "HOOG"
}
