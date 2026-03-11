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
 * Button syntax for Ger:
 *   {{knop:Label:/pad}}        → navigation button (goes to /pad)
 *   {{vraag:Vraagtekst}}       → chat action button (sends text to Ger)
 */
const BUTTON_REGEX = /\{\{(knop|vraag):([^}]+)\}\}/g

interface ParsedButton {
  type: "knop" | "vraag"
  label: string
  target: string // path for knop, question text for vraag
}

function parseButtons(text: string): { cleanText: string; buttons: ParsedButton[] } {
  const buttons: ParsedButton[] = []
  const cleanText = text.replace(BUTTON_REGEX, (_, type: string, content: string) => {
    if (type === "knop") {
      // Format: knop:Label:/pad
      const lastColon = content.lastIndexOf(":/")
      if (lastColon !== -1) {
        buttons.push({
          type: "knop",
          label: content.substring(0, lastColon).trim(),
          target: content.substring(lastColon + 1).trim(),
        })
      }
    } else if (type === "vraag") {
      // Format: vraag:Tekst
      buttons.push({
        type: "vraag",
        label: content.trim(),
        target: content.trim(),
      })
    }
    return "" // Remove button markers from text
  })
  return { cleanText: cleanText.trimEnd(), buttons }
}

export function AiChat() {
  const router = useRouter()
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      // Convert UI messages (parts format) to model messages (content format)
      // before sending to server, so streamText receives valid ModelMessage[]
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
        return { ...rest, body: { ...body, messages: converted } }
      },
    }),
  })
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const isLoading = status === "submitted" || status === "streaming"

  const suggesties = [
    { tekst: "Hoe gaat het met mij?", emoji: "📊" },
    { tekst: "Welke hulp is er bij mij in de buurt?", emoji: "🏠" },
    { tekst: "Ik ben moe, wat kan ik doen?", emoji: "😴" },
    { tekst: "Tips voor beter slapen", emoji: "🌙" },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false)
    }
  }, [messages.length])

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

  // Haal tekst uit message parts (AI SDK v6)
  const getMessageText = (message: typeof messages[number]): string => {
    const parts = message.parts
    if (!parts || parts.length === 0) return ""
    return parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
      {/* Chat berichten */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welkomstbericht */}
        {messages.length === 0 && (
          <div className="flex gap-3 items-start">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm p-3.5 shadow-sm">
                <p className="font-semibold text-foreground mb-1">Hoi! Ik ben Ger</p>
                <p className="text-sm text-muted-foreground">
                  Fijn dat je er bent. Vertel me wat je bezighoudt, dan kijken we samen wat er mogelijk is.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Suggesties */}
        {showSuggestions && messages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {suggesties.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.tekst)}
                className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-left text-sm"
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="text-foreground">{s.tekst}</span>
              </button>
            ))}
          </div>
        )}

        {/* Berichten */}
        {messages.map((message) => {
          const rawText = getMessageText(message)
          if (!rawText) return null

          const isAssistant = message.role === "assistant"
          // Parse hulpkaarten, artikelkaarten, dan knoppen uit de resterende tekst
          const { cleanText: textWithoutCards, kaarten } = isAssistant
            ? parseHulpkaarten(rawText)
            : { cleanText: rawText, kaarten: [] }
          const { cleanText: textWithoutArticles, artikelen } = isAssistant
            ? parseArtikelkaarten(textWithoutCards)
            : { cleanText: textWithoutCards, artikelen: [] }
          const { cleanText, buttons } = isAssistant
            ? parseButtons(textWithoutArticles)
            : { cleanText: textWithoutArticles, buttons: [] }
          // Splits in actieknoppen (navigatie, max 1) en vraagknoppen (chat, max 2)
          const actieKnoppen = buttons.filter(b => b.type === "knop").slice(0, 1)
          const vraagKnoppen = buttons.filter(b => b.type === "vraag").slice(0, 2)

          // Gebruikersbericht — rechts uitgelijnd, geen avatar
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex justify-end pl-12">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[85%]">
                  <p className="text-sm leading-relaxed">{cleanText}</p>
                </div>
              </div>
            )
          }

          // Ger-bericht — links uitgelijnd met GerAvatar
          const hasExtras = actieKnoppen.length > 0 || kaarten.length > 0 || artikelen.length > 0 || vraagKnoppen.length > 0
          return (
            <div key={message.id} className="flex gap-3 items-start pr-8">
              <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5" />

              <div className="flex-1 min-w-0">
                {/* Één samenhangende bubble: tekst + hulpkaarten + knoppen */}
                <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                  {/* Tekst */}
                  {cleanText && (
                    <div className="px-4 py-3">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {formatMessage(cleanText)}
                      </div>
                    </div>
                  )}

                  {/* Hulpkaarten + actieknoppen + vraagknoppen — in de bubble */}
                  {hasExtras && (
                    <div className={cn("px-3 pb-3 flex flex-col gap-1.5", cleanText && "pt-0")}>
                      {/* Actieknop — max 1 */}
                      {actieKnoppen.map((btn, i) => (
                        <button
                          key={`a-${i}`}
                          onClick={() => handleButtonClick(btn)}
                          disabled={isLoading}
                          className={cn(
                            "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all text-left",
                            "bg-[var(--accent-green-bg)]/60 border border-[var(--accent-green)]/15 text-foreground hover:border-[var(--accent-green)]/30 hover:bg-[var(--accent-green-bg)]",
                            isLoading && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <svg className="w-4 h-4 text-[var(--accent-green)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="flex-1 truncate text-sm font-medium">{btn.label}</span>
                        </button>
                      ))}

                      {/* Hulpkaarten — max 2, compact inline */}
                      {kaarten.slice(0, 2).map((kaart, i) => (
                        <HulpKaart key={`h-${i}`} kaart={kaart} />
                      ))}

                      {/* Artikelkaarten — max 3, compact inline */}
                      {artikelen.slice(0, 3).map((artikel, i) => (
                        <ArtikelKaart key={`art-${i}`} artikel={artikel} />
                      ))}

                      {/* Vraagknoppen — horizontal chips */}
                      {vraagKnoppen.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {vraagKnoppen.map((btn, i) => (
                            <button
                              key={`v-${i}`}
                              onClick={() => handleButtonClick(btn)}
                              disabled={isLoading}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                "bg-white/60 dark:bg-card/60 border border-[var(--accent-amber)]/15 text-foreground",
                                "hover:bg-white dark:hover:bg-card hover:border-[var(--accent-amber)]/30",
                                isLoading && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <span>{btn.label}</span>
                              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Laden */}
        {isLoading && (
          <div className="flex gap-3 items-start pr-8">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5" />
            <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted-foreground">Ger typt...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex gap-3 items-start pr-8">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5 opacity-50" />
            <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-2xl rounded-tl-sm p-3.5">
              <p className="text-sm text-foreground">
                {error.message?.includes("503") || error.message?.includes("niet beschikbaar")
                  ? "De AI-assistent is tijdelijk niet beschikbaar. Neem contact op met de beheerder."
                  : "Oeps, dat lukte niet. Probeer het opnieuw."
                }
              </p>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
                  if (lastUserMsg) {
                    const text = lastUserMsg.parts
                      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                      .map(p => p.text)
                      .join("") || ""
                    if (text) handleSend(text)
                  }
                }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Opnieuw proberen
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stel je vraag..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "p-3 rounded-xl transition-all flex-shrink-0",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground"
            )}
            aria-label="Verstuur bericht"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

function formatMessage(content: string): React.ReactNode {
  const lines = content.split("\n")
  return lines.map((line, i) => {
    // Bold
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
