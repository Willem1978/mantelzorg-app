"use client"

import DOMPurify from "isomorphic-dompurify"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { parseHulpkaarten, HulpKaart } from "@/components/ai/HulpKaart"
import { parseArtikelkaarten, ArtikelKaart } from "@/components/ai/ArtikelKaart"

/**
 * Button syntax parsing:
 *   {{knop:Label:/pad}}   → navigation button
 *   {{vraag:Vraagtekst}}  → chat action button
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
        buttons.push({ type: "knop", label: content.substring(0, lastColon).trim(), target: content.substring(lastColon + 1).trim() })
      }
    } else if (type === "vraag") {
      buttons.push({ type: "vraag", label: content.trim(), target: content.trim() })
    }
    return ""
  })
  return { cleanText: cleanText.trimEnd(), buttons }
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

/**
 * Bepaal de pagina-context op basis van het pad.
 * Dit wordt meegegeven aan de API zodat Ger weet op welke pagina de gebruiker zit.
 */
function getPaginaContext(pathname: string): string {
  if (pathname.startsWith("/leren")) return "informatie"
  if (pathname.startsWith("/hulpvragen")) return "hulp"
  if (pathname.startsWith("/buddys")) return "mantelbuddy"
  if (pathname.startsWith("/belastbaarheidstest")) return "balanstest"
  if (pathname.startsWith("/check-in")) return "checkin"
  if (pathname === "/dashboard") return "dashboard"
  if (pathname === "/rapport") return "rapport"
  if (pathname === "/agenda") return "agenda"
  if (pathname === "/profiel") return "profiel"
  return "algemeen"
}

/**
 * FloatingGerChat — De floating chat widget voor Ger op alle dashboard-pagina's.
 *
 * Kenmerken:
 * - Floating button rechtsonder (zoals de huidige "Vraag Ger" knop)
 * - Opent een chatpaneel bij klikken
 * - Stuurt pagina-context mee naar de API
 * - Auto-start bericht bij openen (pagina-specifiek)
 */
export function FloatingGerChat() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [hasSentInitial, setHasSentInitial] = useState(false)
  const [currentPage, setCurrentPage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const paginaContext = getPaginaContext(pathname)

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/balanscoach",
      prepareSendMessagesRequest: async ({ messages: msgs, body, ...rest }) => {
        const converted = msgs
          .map((msg) => ({
            role: msg.role,
            content: msg.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("") || "",
          }))
          // Filter lege berichten (tool-call stappen zonder tekst) — die laten de API crashen
          .filter((msg) => msg.content.trim() !== "")
        return { ...rest, body: { ...body, messages: converted, pagina: paginaContext } }
      },
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"

  // Als de pagina verandert en chat open is, reset en stuur nieuwe context
  useEffect(() => {
    if (isOpen && currentPage !== paginaContext) {
      setCurrentPage(paginaContext)
      setHasSentInitial(false)
      setMessages([])
    }
  }, [paginaContext, isOpen, currentPage, setMessages])

  // Stuur automatisch een contextbericht bij openen
  useEffect(() => {
    if (isOpen && !hasSentInitial) {
      setHasSentInitial(true)
      setCurrentPage(paginaContext)

      const startBericht = getStartBericht(paginaContext)
      sendMessage({ text: startBericht })
    }
  }, [isOpen, hasSentInitial, paginaContext, sendMessage])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const getMessageText = (message: typeof messages[number]): string => {
    const parts = message.parts
    if (!parts || parts.length === 0) return ""
    return parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isLoading) return
    sendMessage({ text: text.trim() })
    setInput("")
  }, [isLoading, sendMessage])

  const handleButtonClick = useCallback((button: ParsedButton) => {
    if (button.type === "knop") {
      router.push(button.target)
    } else {
      handleSend(button.target)
    }
  }, [router, handleSend])

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  // Floating button (gesloten)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-all active:scale-95"
        aria-label="Vraag Ger"
      >
        <GerAvatar size="xs" className="!w-6 !h-6" />
        <span className="text-sm font-medium hidden sm:inline">Vraag Ger</span>
      </button>
    )
  }

  // Chat panel (open)
  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GerAvatar size="xs" className="!w-8 !h-8" />
            <div>
              <span className="font-semibold text-sm text-foreground">Ger</span>
              <p className="text-[10px] text-muted-foreground">Je MantelCoach</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Berichten */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {messages.map((message) => {
              const rawText = getMessageText(message)
              if (!rawText) return null
              // Verberg systeem-startberichten (pagina-context)
              if (message.role === "user" && rawText.startsWith("[pagina:")) return null

              const isAssistant = message.role === "assistant"
              const { cleanText: textWithoutCards, kaarten } = isAssistant
                ? parseHulpkaarten(rawText)
                : { cleanText: rawText, kaarten: [] }
              const { cleanText: textWithoutArticles, artikelen } = isAssistant
                ? parseArtikelkaarten(textWithoutCards)
                : { cleanText: textWithoutCards, artikelen: [] }
              const { cleanText, buttons } = isAssistant
                ? parseButtons(textWithoutArticles)
                : { cleanText: textWithoutArticles, buttons: [] }
              const actieKnoppen = buttons.filter(b => b.type === "knop").slice(0, 1)

              // Gebruikersbericht — rechts uitgelijnd
              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%] shadow-sm">
                      <p className="text-sm leading-relaxed">{cleanText}</p>
                    </div>
                  </div>
                )
              }

              // Ger-bericht — bubble = alleen tekst, kaarten eronder
              const hasCards = actieKnoppen.length > 0 || kaarten.length > 0 || artikelen.length > 0
              return (
                <div key={message.id} className="flex gap-2.5 items-start">
                  <GerAvatar size="xs" className="!w-7 !h-7 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 max-w-[90%] flex flex-col gap-1.5">
                    {/* Tekstbubble */}
                    {cleanText && (
                      <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm shadow-sm px-3.5 py-2.5">
                        <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {formatMessage(cleanText)}
                        </div>
                      </div>
                    )}

                    {/* Kaarten als bijlagen onder de bubble */}
                    {hasCards && (
                      <div className="flex flex-col gap-1.5 max-w-[90%]">
                        {actieKnoppen.map((btn, i) => (
                          <button
                            key={`a-${i}`}
                            onClick={() => handleButtonClick(btn)}
                            disabled={isLoading}
                            className={cn(
                              "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all text-left",
                              "bg-[var(--accent-green-bg)]/60 border border-[var(--accent-green)]/15 text-foreground hover:border-[var(--accent-green)]/30",
                              isLoading && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <svg className="w-4 h-4 text-[var(--accent-green)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="flex-1 font-medium">{btn.label}</span>
                          </button>
                        ))}
                        {kaarten.slice(0, 2).map((kaart, i) => (
                          <HulpKaart key={`h-${i}`} kaart={kaart} />
                        ))}
                        {artikelen.slice(0, 3).map((artikel, i) => (
                          <ArtikelKaart key={`art-${i}`} artikel={artikel} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

          {/* Laden */}
          {isLoading && (
            <div className="flex gap-2.5 items-start">
              <GerAvatar size="xs" className="!w-7 !h-7 flex-shrink-0 mt-0.5" />
              <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Ger typt...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-xl p-3 space-y-2">
              <p className="text-sm text-foreground">
                Oeps, dat lukte niet. {error.message && error.message !== "fetch failed" ? error.message : "Probeer het later opnieuw."}
              </p>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
                  if (lastUserMsg) {
                    const text = getMessageText(lastUserMsg)
                    if (text) sendMessage({ text })
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestie-chips boven input — van het laatste Ger-bericht */}
        {(() => {
          const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")
          if (!lastAssistant || isLoading) return null
          const raw = getMessageText(lastAssistant)
          if (!raw) return null
          const { cleanText: t1 } = parseHulpkaarten(raw)
          const { cleanText: t2 } = parseArtikelkaarten(t1)
          const { buttons: btns } = parseButtons(t2)
          const sugChips = btns.filter(b => b.type === "vraag").slice(0, 2)
          if (sugChips.length === 0) return null
          return (
            <div className="px-3 pt-2 flex flex-wrap gap-1.5">
              {sugChips.map((btn, i) => (
                <button
                  key={`s-${i}`}
                  onClick={() => handleButtonClick(btn)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-primary/5 border border-primary/15 text-foreground hover:bg-primary/10 hover:border-primary/30"
                >
                  <span>{btn.label}</span>
                  <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )
        })()}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(input) }}
          className="flex items-center gap-2 p-3 border-t border-border"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type jouw vraag hier..."
            className="flex-1 px-3 py-2 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground"
            )}
          >
            Verstuur
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

/**
 * Geeft het initiële bericht terug dat Ger stuurt op basis van de pagina.
 * Dit bericht wordt als "user" gestuurd zodat Ger erop reageert.
 */
function getStartBericht(pagina: string): string {
  switch (pagina) {
    case "informatie":
      return "[pagina:informatie] De gebruiker heeft de chat geopend op de Informatie-pagina (tips en artikelen)."
    case "hulp":
      return "[pagina:hulp] De gebruiker heeft de chat geopend op de Hulp-pagina (hulp zoeken in de buurt)."
    case "mantelbuddy":
      return "[pagina:mantelbuddy] De gebruiker heeft de chat geopend op de MantelBuddy-pagina (een buddy zoeken)."
    case "balanstest":
      return "[pagina:balanstest] De gebruiker heeft de chat geopend op de Balanstest-pagina."
    case "checkin":
      return "[pagina:checkin] De gebruiker heeft de chat geopend op de Check-in pagina."
    case "rapport":
      return "[pagina:rapport] De gebruiker heeft de chat geopend op de Rapport-pagina."
    case "profiel":
      return "[pagina:profiel] De gebruiker heeft de chat geopend op de Profiel-pagina."
    default:
      return "[pagina:algemeen] De gebruiker heeft de chat geopend."
  }
}
