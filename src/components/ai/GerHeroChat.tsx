"use client"

import DOMPurify from "isomorphic-dompurify"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { parseHulpkaarten, HulpKaart, cleanRemainingMarkers } from "@/components/ai/HulpKaart"
import { parseArtikelkaarten, ArtikelKaart } from "@/components/ai/ArtikelKaart"

/**
 * Ingebed Ger chatvenster voor de homepage.
 *
 * Geen popup, maar een vaste kaart met direct zichtbaar chatvenster.
 * Ger is het centrale element — warm, uitnodigend, direct bruikbaar.
 */

const BUTTON_REGEX = /\{\{(knop|vraag):([^}]+)\}\}/g

interface ParsedButton {
  type: "knop" | "vraag"
  label: string
  target: string
}

function parseButtons(text: string): { cleanText: string; buttons: ParsedButton[] } {
  const buttons: ParsedButton[] = []
  const cleanText = text.replace(BUTTON_REGEX, (_, type: string, content: string) => {
    if (type === "knop") {
      const lastColon = content.lastIndexOf(":/")
      if (lastColon !== -1) {
        buttons.push({
          type: "knop",
          label: content.substring(0, lastColon).trim(),
          target: content.substring(lastColon + 1).trim(),
        })
      }
    } else if (type === "vraag") {
      buttons.push({
        type: "vraag",
        label: content.trim(),
        target: content.trim(),
      })
    }
    return ""
  })
  return { cleanText: cleanText.trimEnd(), buttons }
}

const suggesties = [
  { tekst: "Doe de balanstest", emoji: "📊", beschrijving: "Ontdek hoe het met je gaat" },
  { tekst: "Welke hulp is er in mijn gemeente?", emoji: "🏘️", beschrijving: "Vind hulp in de buurt" },
  { tekst: "Ik ben moe en heb weinig tijd voor mezelf", emoji: "💭", beschrijving: "Praat met Ger" },
]

export function GerHeroChat() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/welkom",
      prepareSendMessagesRequest: async ({ messages: msgs, body, ...rest }) => {
        const converted = msgs.map((msg) => ({
          role: msg.role,
          content: msg.parts
            ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("") || "",
        }))
        return { ...rest, body: { ...body, messages: converted } }
      },
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isLoading) return
    sendMessage({ text: text.trim() })
    setInput("")
  }, [isLoading, sendMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

  const handleButtonClick = useCallback((button: ParsedButton) => {
    if (button.type === "knop") {
      router.push(button.target)
    } else {
      handleSend(button.target)
    }
  }, [router, handleSend])

  const getMessageText = (message: typeof messages[number]): string => {
    const parts = message.parts
    if (!parts || parts.length === 0) return ""
    return parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  const hasMessages = messages.length > 0

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Header met Ger */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <GerAvatar size="sm" className="!w-10 !h-10" animate />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Ger</p>
            <p className="text-xs text-muted-foreground">Je persoonlijke coach</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        {/* Berichten */}
        <div className="h-[340px] overflow-y-auto px-4 py-4 space-y-4">
          {/* Welkomstbericht — altijd zichtbaar als er nog geen berichten zijn */}
          {!hasMessages && (
            <>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">💚</span>
                </div>
                <div className="flex-1">
                  <div className="bg-primary/5 rounded-2xl rounded-tl-md p-4 border border-primary/10">
                    <p className="text-sm text-foreground leading-relaxed">
                      <strong>Hoi, ik ben Ger!</strong> Fijn dat je er bent.
                      Zorg je voor iemand? Vertel me gerust wat er speelt — ik help je graag op weg.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestieknoppen */}
              <div className="space-y-2 mt-3">
                {suggesties.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.tekst)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-left"
                  >
                    <span className="text-xl flex-shrink-0">{s.emoji}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block">{s.tekst}</span>
                      <span className="text-xs text-muted-foreground">{s.beschrijving}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Chat berichten */}
          {messages.map((message) => {
            const rawText = getMessageText(message)
            if (!rawText) return null

            const isAssistant = message.role === "assistant"
            const { cleanText: textWithoutCards, kaarten } = isAssistant
              ? parseHulpkaarten(rawText)
              : { cleanText: rawText, kaarten: [] }
            const { cleanText: textWithoutArticles, artikelen } = isAssistant
              ? parseArtikelkaarten(textWithoutCards)
              : { cleanText: textWithoutCards, artikelen: [] }
            const { cleanText: textWithoutButtons, buttons } = isAssistant
              ? parseButtons(textWithoutArticles)
              : { cleanText: textWithoutArticles, buttons: [] }
            const cleanText = isAssistant ? cleanRemainingMarkers(textWithoutButtons) : textWithoutButtons
            // kaarten en knoppen worden apart onder de input gerenderd

            // Gebruikersbericht
            if (message.role === "user") {
              return (
                <div key={message.id} className="flex justify-end pl-8">
                  <div className="rounded-2xl p-3 shadow-sm bg-primary text-primary-foreground rounded-tr-md max-w-[85%]">
                    <p className="text-sm leading-relaxed">{cleanText}</p>
                  </div>
                </div>
              )
            }

            // Ger-bericht — bubble = alleen tekst
            return (
              <div key={message.id} className="flex gap-3 items-start pr-8">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">💚</span>
                </div>
                <div className="flex-1 min-w-0">
                  {cleanText && (
                    <div className="rounded-2xl shadow-sm bg-primary/5 border border-primary/10 rounded-tl-md p-3">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {formatMessage(cleanText)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">💚</span>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-md p-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-red-bg)] flex items-center justify-center flex-shrink-0">
                <span className="text-sm">😔</span>
              </div>
              <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-2xl rounded-tl-md p-3">
                <p className="text-sm text-foreground">
                  Sorry, er ging iets mis. Probeer het nog eens.
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card p-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type hier jouw vraag of kies een van onderstaande vragen"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "p-2.5 rounded-xl transition-all flex-shrink-0",
                input.trim() && !isLoading
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground"
              )}
              aria-label="Verstuur"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>

          {/* Vraagknoppen als spraakbubbels + hulpkaarten sectie */}
          {(() => {
            const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")
            if (!lastAssistant || isLoading) return null
            const raw = getMessageText(lastAssistant)
            if (!raw) return null
            const { cleanText: t1, kaarten } = parseHulpkaarten(raw)
            const { cleanText: t2, artikelen } = parseArtikelkaarten(t1)
            const { buttons: btns } = parseButtons(t2)
            const vraagChips = btns.filter(b => b.type === "vraag").slice(0, 2)
            const hulpCards = kaarten.slice(0, 2)
            const artikelCards = artikelen.slice(0, 3)
            const hasVragen = vraagChips.length > 0
            const hasCards = hulpCards.length > 0 || artikelCards.length > 0
            if (!hasVragen && !hasCards) return null
            return (
              <>
                {hasVragen && (
                  <div className="mt-2 flex flex-col gap-1.5 items-end">
                    {vraagChips.map((btn, i) => (
                      <button
                        key={`s-${i}`}
                        onClick={() => handleButtonClick(btn)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm text-sm transition-all text-left bg-primary/8 border border-primary/15 text-foreground hover:bg-primary/15 hover:border-primary/25 active:scale-[0.98]"
                      >
                        <svg className="w-3.5 h-3.5 text-primary/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {hasCards && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {hulpCards.length > 0 ? "Hulp voor jou en jouw naaste" : "Informatie voor jou"}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {hulpCards.map((kaart, i) => (
                        <HulpKaart key={`h-${i}`} kaart={kaart} />
                      ))}
                      {artikelCards.map((artikel, i) => (
                        <ArtikelKaart key={`art-${i}`} artikel={artikel} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

function formatMessage(content: string): React.ReactNode {
  const lines = content.split("\n")
  return lines.map((line, i) => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-primary">•</span>
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted.slice(2)) }} />
        </div>
      )
    }
    if (formatted !== line) {
      return <p key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }} />
    }
    return line ? <p key={i}>{line}</p> : <br key={i} />
  })
}
