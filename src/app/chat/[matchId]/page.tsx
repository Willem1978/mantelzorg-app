"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface Bericht {
  id: string
  inhoud: string
  afzenderId: string
  isGelezen: boolean
  createdAt: string
}

interface MatchInfo {
  id: string
  status: string
  buddyNaam: string
  mantelzorgerNaam: string
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [berichten, setBerichten] = useState<Bericht[]>([])
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)
  const [mijnUserId, setMijnUserId] = useState<string | null>(null)
  const [nieuwBericht, setNieuwBericht] = useState("")
  const [loading, setLoading] = useState(true)
  const [verzenden, setVerzenden] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect als niet ingelogd
  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      router.push("/login")
    }
  }, [session, status, router])

  // Berichten laden
  const fetchBerichten = useCallback(async () => {
    try {
      const res = await fetch(`/api/berichten/${matchId}`)
      if (!res.ok) throw new Error("Laden mislukt")
      const json = await res.json()
      setBerichten(json.berichten || [])
      setMatchInfo(json.match || null)
      setMijnUserId(json.mijnUserId || null)
    } catch {
      setError("Berichten laden mislukt")
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    if (!session?.user?.id) return
    fetchBerichten()

    // Poll elke 5 seconden voor nieuwe berichten
    pollRef.current = setInterval(fetchBerichten, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [session, fetchBerichten])

  // Scroll naar beneden bij nieuwe berichten
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [berichten])

  // Bericht versturen
  const handleVerstuur = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nieuwBericht.trim() || verzenden) return

    setVerzenden(true)
    try {
      const res = await fetch(`/api/berichten/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inhoud: nieuwBericht.trim() }),
      })

      if (!res.ok) throw new Error("Versturen mislukt")

      setNieuwBericht("")
      await fetchBerichten()
      inputRef.current?.focus()
    } catch {
      setError("Bericht versturen mislukt")
    } finally {
      setVerzenden(false)
    }
  }

  // Enter om te versturen, Shift+Enter voor nieuwe regel
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleVerstuur(e)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    )
  }

  if (error && !matchInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            Terug
          </button>
        </div>
      </div>
    )
  }

  const andereNaam = mijnUserId && matchInfo
    ? (session?.user?.role === "BUDDY" ? matchInfo.mantelzorgerNaam : matchInfo.buddyNaam)
    : "Chat"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
          aria-label="Terug"
        >
          ←
        </button>
        <div className="flex items-center gap-3 flex-1">
          <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {andereNaam.charAt(0)}
          </span>
          <div>
            <h1 className="font-semibold text-foreground text-sm">
              {andereNaam}
            </h1>
            {matchInfo?.status === "ACTIEF" && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Actieve match
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Berichten */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {berichten.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-muted-foreground text-sm">
              Stuur een bericht om het gesprek te starten.
            </p>
          </div>
        ) : (
          berichten.map((bericht) => {
            const isMijn = bericht.afzenderId === mijnUserId
            const tijd = new Date(bericht.createdAt).toLocaleTimeString("nl-NL", {
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <div
                key={bericht.id}
                className={cn(
                  "flex",
                  isMijn ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    isMijn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {bericht.inhoud}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isMijn
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {tijd}
                    {isMijn && bericht.isGelezen && " ✓✓"}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleVerstuur}
        className="bg-card border-t border-border px-4 py-3 flex items-end gap-2 sticky bottom-0"
      >
        <textarea
          ref={inputRef}
          value={nieuwBericht}
          onChange={(e) => setNieuwBericht(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Typ een bericht..."
          rows={1}
          className="flex-1 text-sm border border-border rounded-2xl px-4 py-2.5 bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
          style={{ minHeight: "40px" }}
        />
        <button
          type="submit"
          disabled={!nieuwBericht.trim() || verzenden}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
            nieuwBericht.trim()
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {verzenden ? "..." : "→"}
        </button>
      </form>
    </div>
  )
}
