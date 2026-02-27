"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { parseHulpkaarten, HulpKaart } from "@/components/ai/HulpKaart"

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
          <GerAvatar size="md" />
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
        <GerAvatar size="sm" className="!w-10 !h-10" />
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
          const { cleanText, buttons } = isAssistant
            ? parseButtons(textWithoutCards)
            : { cleanText: textWithoutCards, buttons: [] }

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 items-start",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10"
                )}
              >
                {message.role === "user" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <span className="text-sm">💚</span>
                )}
              </div>

              <div className={cn(
                "max-w-[85%] flex flex-col gap-2",
                message.role === "user" && "items-end"
              )}>
                {cleanText && (
                  <div
                    className={cn(
                      "rounded-2xl p-3 shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-primary/5 border border-primary/10 rounded-tl-md"
                    )}
                  >
                    <div className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap",
                      message.role === "user" ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {formatMessage(cleanText)}
                    </div>
                  </div>
                )}

                {kaarten.length > 0 && (
                  <div className="flex flex-col gap-2 w-full">
                    {kaarten.map((kaart, i) => (
                      <HulpKaart key={i} kaart={kaart} />
                    ))}
                  </div>
                )}

                {buttons.length > 0 && (
                  <div className="flex flex-col gap-1.5 w-full">
                    {buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => handleButtonClick(btn)}
                        disabled={isLoading}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                          "bg-primary/5 border border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40",
                          isLoading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1">{btn.label}</span>
                        {btn.type === "knop" ? (
                          <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        )}
                      </button>
                    ))}
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
            placeholder="Vertel, wat speelt er bij jou?"
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
          <span dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
        </div>
      )
    }
    if (formatted !== line) {
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
    }
    return line ? <p key={i}>{line}</p> : <br key={i} />
  })
}
