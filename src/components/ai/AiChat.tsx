"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"

export function AiChat() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  })
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const isLoading = status === "submitted" || status === "streaming"

  const suggesties = [
    { tekst: "Welke hulp is er bij mij in de buurt?", emoji: "🏠" },
    { tekst: "Ik ben moe, wat kan ik doen?", emoji: "😴" },
    { tekst: "Hoe vraag ik respijtzorg aan?", emoji: "🤝" },
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

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return
    sendMessage({ text: text.trim() })
    setInput("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

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
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🤖</span>
            </div>
            <div className="flex-1">
              <div className="bg-card rounded-2xl rounded-tl-md p-4 border border-border shadow-sm">
                <p className="font-semibold text-foreground mb-1">Hoi! Ik ben Ger</p>
                <p className="text-sm text-muted-foreground">
                  Ik help je graag met vragen over mantelzorg. Vraag me bijvoorbeeld
                  over hulp in de buurt, tips voor jezelf, of hoe de app werkt.
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
          const text = getMessageText(message)
          if (!text) return null

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 items-start",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              {/* Avatar */}
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
                  <span className="text-sm">🤖</span>
                )}
              </div>

              {/* Bericht */}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl p-3 shadow-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-card border border-border rounded-tl-md"
                )}
              >
                <div className={cn(
                  "text-sm leading-relaxed whitespace-pre-wrap",
                  message.role === "user" ? "text-primary-foreground" : "text-foreground"
                )}>
                  {formatMessage(text)}
                </div>
              </div>
            </div>
          )
        })}

        {/* Laden */}
        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🤖</span>
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md p-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-red-bg)] flex items-center justify-center flex-shrink-0">
              <span className="text-sm">⚠️</span>
            </div>
            <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-2xl rounded-tl-md p-3">
              <p className="text-sm text-foreground">
                {error.message?.includes("503") || error.message?.includes("niet beschikbaar")
                  ? "De AI-assistent is tijdelijk niet beschikbaar. Neem contact op met de beheerder."
                  : "Er ging iets mis bij het versturen van je bericht. Probeer het opnieuw."
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
