"use client"

import DOMPurify from "isomorphic-dompurify"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { parseHulpkaarten, HulpKaart } from "@/components/ai/HulpKaart"
import { parseArtikelkaarten, ArtikelKaart } from "@/components/ai/ArtikelKaart"

/**
 * Publieke Ger chat widget voor de homepage.
 *
 * Geen login nodig. Ger is er meteen — warm, persoonlijk, uitnodigend.
 * Drijft op /api/ai/welkom (rate-limited, geen auth).
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

export function PublicGerChat() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
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

  const suggesties = [
    { tekst: "Ik zorg voor iemand en weet niet waar ik moet beginnen", emoji: "💭" },
    { tekst: "Ik ben moe en heb weinig tijd voor mezelf", emoji: "😔" },
    { tekst: "Welke hulp is er in mijn gemeente?", emoji: "🏘️" },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isLoading) return
    if (!hasInteracted) setHasInteracted(true)
    sendMessage({ text: text.trim() })
    setInput("")
  }, [isLoading, sendMessage, hasInteracted])

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

  // Floating button wanneer chat dicht is
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Praat met Ger"
      >
        <div className="relative">
          <GerAvatar size="md" animate />
          {/* Pulserende ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
          {/* Tekstballon */}
          <div className="absolute -top-14 -left-28 bg-card border border-border rounded-2xl px-4 py-2 shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-sm font-medium text-foreground">Hoi! Kan ik je helpen?</p>
            <div className="absolute bottom-0 right-8 translate-y-1/2 rotate-45 w-3 h-3 bg-card border-r border-b border-border" />
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <GerAvatar size="sm" className="!w-10 !h-10" animate />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">Ger</p>
          <p className="text-xs text-muted-foreground">Je persoonlijke coach</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
          aria-label="Sluit chat"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Berichten */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welkomstbericht van Ger — altijd zichtbaar */}
        {messages.length === 0 && (
          <>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">💚</span>
              </div>
              <div className="flex-1">
                <div className="bg-primary/5 rounded-2xl rounded-tl-md p-4 border border-primary/10">
                  <p className="font-semibold text-foreground mb-1 text-sm">Hoi, ik ben Ger</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Fijn dat je er bent. Zorg je voor iemand? Of maak je je ergens zorgen over?
                    Vertel me gerust wat er speelt — ik luister.
                  </p>
                </div>
              </div>
            </div>

            {/* Suggesties */}
            <div className="space-y-2 mt-2">
              {suggesties.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.tekst)}
                  className="flex items-center gap-2.5 w-full p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-left text-sm"
                >
                  <span className="text-lg flex-shrink-0">{s.emoji}</span>
                  <span className="text-foreground">{s.tekst}</span>
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
          const { cleanText, buttons } = isAssistant
            ? parseButtons(textWithoutArticles)
            : { cleanText: textWithoutArticles, buttons: [] }
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

        {/* Laden */}
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

        {/* Error */}
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
                      <span>{btn.label}</span>
                      <svg className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
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
