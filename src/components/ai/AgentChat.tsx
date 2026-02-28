"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { parseHulpkaarten, HulpKaart } from "@/components/ai/HulpKaart"

/**
 * Button syntax parsing (shared with AiChat):
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

interface AgentChatProps {
  /** API endpoint, bijv. "/api/ai/balanscoach" of "/api/ai/checkin" */
  apiEndpoint: string
  /** Initieel bericht dat automatisch naar de agent wordt gestuurd */
  initialMessage: string
  /** Of het panel standaard open/zichtbaar is */
  defaultOpen?: boolean
  /** Titel boven het chatpanel */
  title?: string
  /** Extra CSS classes */
  className?: string
}

/**
 * Herbruikbaar chat-paneel voor AI agents (Balanscoach, Check-in Buddy).
 * Stuurt automatisch een initieel bericht bij mount en toont de streaming response.
 */
export function AgentChat({
  apiEndpoint,
  initialMessage,
  defaultOpen = true,
  title = "Advies van Ger",
  className,
}: AgentChatProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [hasSentInitial, setHasSentInitial] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: apiEndpoint,
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

  // Stuur initieel bericht automatisch bij mount
  useEffect(() => {
    if (!hasSentInitial && initialMessage) {
      setHasSentInitial(true)
      sendMessage({ text: initialMessage })
    }
  }, [hasSentInitial, initialMessage, sendMessage])

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="ker-card hover:border-primary/50 transition-all py-3 w-full text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">Tik om persoonlijk advies te zien</p>
          </div>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    )
  }

  return (
    <div className={cn("ker-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <span className="font-semibold text-sm text-foreground">{title}</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Sluiten"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Berichten */}
      <div className="max-h-80 overflow-y-auto space-y-3 mb-3">
        {messages
          .filter((m) => m.role === "assistant")
          .map((message) => {
            const rawText = getMessageText(message)
            if (!rawText) return null
            const { cleanText: textWithoutCards, kaarten } = parseHulpkaarten(rawText)
            const { cleanText, buttons } = parseButtons(textWithoutCards)

            return (
              <div key={message.id}>
                {cleanText && (
                  <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {formatMessage(cleanText)}
                  </div>
                )}
                {kaarten.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {kaarten.map((kaart, i) => (
                      <HulpKaart key={i} kaart={kaart} />
                    ))}
                  </div>
                )}
                {buttons.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-3">
                    {buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => handleButtonClick(btn)}
                        disabled={isLoading}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                          "bg-primary/5 border border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40",
                          isLoading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1">{btn.label}</span>
                        {btn.type === "knop" ? (
                          <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

        {/* Laden */}
        {isLoading && messages.filter((m) => m.role === "assistant").every((m) => !getMessageText(m)) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs">Ger denkt na...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-xl p-3">
            <p className="text-sm text-foreground">
              Oeps, dat lukte niet. Probeer het later opnieuw.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input voor vervolgvragen */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(input) }}
        className="flex items-center gap-2 pt-2 border-t border-border"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Stel een vervolgvraag..."
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={cn(
            "p-2 rounded-lg transition-all flex-shrink-0",
            input.trim() && !isLoading
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
