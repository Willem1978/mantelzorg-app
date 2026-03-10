"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { parseHulpkaarten, HulpKaart } from "@/components/ai/HulpKaart"
import Link from "next/link"
import { sanitizeHtml } from "@/lib/sanitize"

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
  return { cleanText: cleanText.replace(/\n{3,}/g, "\n\n").trim(), buttons }
}

export interface GerChatContext {
  userName: string
  hasTest: boolean
  hasProfile: boolean
  niveau?: "LAAG" | "GEMIDDELD" | "HOOG" | null
  score?: number | null
  zwareTaken?: number
  zwareTaakNaam?: string | null
  needsNewTest?: boolean
  checkInDone?: boolean
  isFirstVisit?: boolean
  trend?: "improved" | "same" | "worse" | null
  wellbeingTrend?: "up" | "down" | "stable" | null
  daysSinceTest?: number | null
  openTasks?: number
  overdueTasks?: number
}

function buildProactiveActions(ctx: GerChatContext): { label: string; emoji: string; action: string; color: string }[] {
  const actions: { label: string; emoji: string; action: string; color: string }[] = []

  // PRIORITEIT 1: Heeft een test → help ze verder (ongeacht profielstatus)
  if (ctx.hasTest) {
    // Knop 1: contextgevoelig op basis van situatie
    if (ctx.niveau === "HOOG") {
      actions.push({ label: "Ik heb hulp nodig", emoji: "❤️", action: "vraag", color: "rose" })
    } else if (ctx.trend === "worse" || ctx.wellbeingTrend === "down") {
      actions.push({ label: "Het gaat niet zo goed", emoji: "💬", action: "vraag", color: "blue" })
    } else if (ctx.overdueTasks && ctx.overdueTasks > 0) {
      actions.push({ label: "Bekijk mijn openstaande acties", emoji: "📋", action: "vraag", color: "blue" })
    } else if (ctx.zwareTaken && ctx.zwareTaken > 0) {
      actions.push({ label: "Help me met mijn zware taken", emoji: "🤝", action: "vraag", color: "amber" })
    } else if (!ctx.checkInDone) {
      actions.push({ label: "Hoe gaat het vandaag?", emoji: "💬", action: "vraag", color: "blue" })
    } else if (ctx.needsNewTest) {
      actions.push({ label: "Doe een nieuwe balanstest", emoji: "📊", action: "/belastbaarheidstest", color: "purple" })
    } else {
      actions.push({ label: "Geef me informatie of een tip", emoji: "💡", action: "vraag", color: "purple" })
    }

    // Knop 2: hulp voor mij — wisselt als trend positief is
    if (ctx.trend === "improved" || ctx.wellbeingTrend === "up") {
      actions.push({ label: "Hoe houd ik dit vast?", emoji: "🌱", action: "vraag", color: "green" })
    } else {
      actions.push({ label: "Welke hulp is er voor mij?", emoji: "🙋", action: "vraag", color: "sky" })
    }

    // Knop 3: hulp voor naaste — wisselt als er specifieke zware taak is
    if (ctx.zwareTaakNaam) {
      actions.push({ label: `Hulp bij ${ctx.zwareTaakNaam}`, emoji: "🏘️", action: "vraag", color: "amber" })
    } else {
      actions.push({ label: "Welke hulp is er voor mijn naaste?", emoji: "🏘️", action: "vraag", color: "amber" })
    }
    return actions
  }

  // PRIORITEIT 2: Geen test maar wel een profiel → stuur aan op test
  if (ctx.hasProfile) {
    actions.push({ label: "Start de balanstest", emoji: "📊", action: "/belastbaarheidstest", color: "purple" })
    actions.push({ label: "Wat is de balanstest?", emoji: "❓", action: "vraag", color: "sky" })
    actions.push({ label: "Geef me een tip", emoji: "💡", action: "vraag", color: "amber" })
    return actions
  }

  // PRIORITEIT 3: Helemaal nieuw → welkom
  actions.push({ label: "Wat kan ik hier doen?", emoji: "💡", action: "vraag", color: "amber" })
  actions.push({ label: "Maak mijn profiel aan", emoji: "👤", action: "/profiel", color: "sky" })
  actions.push({ label: "Start de balanstest", emoji: "📊", action: "/belastbaarheidstest", color: "purple" })
  return actions
}

function getGreetingText(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Goedemorgen"
  if (hour < 18) return "Goedemiddag"
  return "Goedenavond"
}

function buildGreetingMessage(ctx: GerChatContext): string {
  const greeting = getGreetingText()
  const naam = ctx.userName || "daar"

  // Terugkerende gebruiker met test — verwijs naar situatie
  if (ctx.hasTest) {
    if (ctx.trend === "worse" || ctx.wellbeingTrend === "down") {
      return `${greeting} ${naam}, ik zie dat het de laatste tijd zwaarder is geworden. Laten we kijken wat ik voor je kan doen.`
    }
    if (ctx.trend === "improved" || ctx.wellbeingTrend === "up") {
      return `${greeting} ${naam}, fijn je weer te zien! Het gaat de goede kant op. Waar kan ik je mee helpen?`
    }
    if (ctx.overdueTasks && ctx.overdueTasks > 0) {
      return `${greeting} ${naam}, je hebt nog een paar dingen openstaan. Zullen we daar even naar kijken?`
    }
    if (ctx.needsNewTest && ctx.daysSinceTest && ctx.daysSinceTest > 30) {
      return `${greeting} ${naam}, je laatste test is alweer een tijdje geleden. Hoe gaat het nu met je?`
    }
    if (ctx.niveau === "HOOG") {
      return `${greeting} ${naam}, goed dat je er bent. Ik weet dat het zwaar is. Wat kan ik voor je doen?`
    }
    if (ctx.zwareTaakNaam) {
      return `${greeting} ${naam}, fijn dat je er bent! Vorige keer hadden we het over ${ctx.zwareTaakNaam}. Hoe gaat het daarmee?`
    }
    return `${greeting} ${naam}, leuk dat je er weer bent! Waar kan ik je mee helpen?`
  }

  // Profiel maar geen test
  if (ctx.hasProfile) {
    return `${greeting} ${naam}, fijn dat je terug bent! Met een balanstest kan ik je veel beter helpen.`
  }

  // Helemaal nieuw
  return `${greeting}! Welkom bij MantelBuddy. Ik ben Ger, je persoonlijke coach. Wat wil je weten?`
}

export function DashboardGerChat({ context }: { context?: GerChatContext }) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")

  const ctx: GerChatContext = context || {
    userName: "daar",
    hasTest: false,
    hasProfile: false,
  }

  const greetingMessage = buildGreetingMessage(ctx)
  const proactiveActions = buildProactiveActions(ctx)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/balanscoach",
      prepareSendMessagesRequest: async ({ messages: msgs, body, ...rest }) => {
        const converted = msgs.map((msg) => ({
          role: msg.role,
          content: msg.parts
            ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("") || "",
        }))
        return { ...rest, body: { ...body, messages: converted, pagina: "dashboard" } }
      },
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"
  const hasMessages = messages.length > 0

  // Toon laad-bolletjes alleen als er nog geen tekst in het laatste assistant-bericht staat.
  // Dit voorkomt dat de bolletjes blijven draaien terwijl de AI tools aanroept NA de tekst.
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant")
  const lastAssistantHasText = lastAssistantMsg?.parts?.some(
    (p): p is { type: "text"; text: string } => p.type === "text" && !!p.text.trim()
  ) ?? false
  const showTypingIndicator = isLoading && !lastAssistantHasText

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
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

  return (
    <div className="flex flex-col">
      {/* Ger intro — begroeting */}
      <div className="flex items-start gap-3 mb-3">
        <GerAvatar size="sm" className="!w-10 !h-10 mt-0.5 flex-shrink-0" animate />
        <div className="flex-1 min-w-0">
          <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-md px-4 py-3">
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {formatMessage(greetingMessage)}
            </div>
          </div>
        </div>
      </div>

      {/* Snelkeuze opties — gekleurde kaarten */}
      {!hasMessages && proactiveActions.length > 0 && (
        <div className="pl-[3.25rem] mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Kies een optie of type jouw vraag:</p>
          <div className="grid gap-2">
            {proactiveActions.map((action, i) => {
              const colorMap: Record<string, string> = {
                amber: "bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800 dark:hover:bg-amber-950/50",
                rose: "bg-rose-50 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-800 dark:hover:bg-rose-950/50",
                sky: "bg-sky-50 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/30 dark:border-sky-800 dark:hover:bg-sky-950/50",
                purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/30 dark:border-purple-800 dark:hover:bg-purple-950/50",
                blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800 dark:hover:bg-blue-950/50",
              }
              const cardColor = colorMap[action.color] || colorMap.amber
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (action.action.startsWith("/")) {
                      router.push(action.action)
                    } else {
                      handleSend(action.label)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all text-left group",
                    cardColor
                  )}
                >
                  <span className="text-xl flex-shrink-0">{action.emoji}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Chat berichten — alleen als er berichten zijn */}
      {hasMessages && (
        <div
          ref={chatContainerRef}
          className="overflow-y-auto space-y-3 mb-4 max-h-[50vh]"
        >
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
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
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
                    <GerAvatar size="xs" className="!w-10 !h-10" />
                  )}
                </div>

                <div className={cn(
                  "flex-1 min-w-0 flex flex-col gap-1.5",
                  message.role === "user" && "items-end"
                )}>
                  {cleanText && (
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
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
                    <div className="flex flex-col gap-1 w-full">
                      {kaarten.slice(0, 3).map((kaart, i) => (
                        <HulpKaart key={i} kaart={kaart} />
                      ))}
                    </div>
                  )}

                  {buttons.length > 0 && (
                    <div className="flex flex-col gap-1.5 w-full">
                      {buttons.slice(0, 3).map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => handleButtonClick(btn)}
                          disabled={showTypingIndicator}
                          className={cn(
                            "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                            "border-2 border-border bg-card hover:bg-primary/5 hover:border-primary/30",
                            showTypingIndicator && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="flex-1">{btn.label}</span>
                          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {showTypingIndicator && (
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <GerAvatar size="xs" className="!w-10 !h-10" />
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-xl p-3 space-y-2">
              <p className="text-sm text-foreground">
                Oeps, dat lukte niet. {error.message && error.message !== "fetch failed" ? error.message : "Probeer het later nog eens."}
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
      )}

      {/* Vraag invoer — duidelijk en onderdeel van de pagina */}
      <div className="bg-card border-2 border-border rounded-2xl px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <GerAvatar size="xs" className="!w-7 !h-7 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type jouw vraag hier..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm py-1"
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

      {/* Link naar volledig gesprek */}
      {hasMessages && (
        <div className="text-center mt-2">
          <Link
            href="/ai-assistent"
            className="text-xs text-primary hover:underline"
          >
            Ga naar volledig gesprek met Ger
          </Link>
        </div>
      )}
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
          <span className="text-primary">&bull;</span>
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatted.slice(2)) }} />
        </div>
      )
    }
    if (formatted !== line) {
      return <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatted) }} />
    }
    return line ? <p key={i}>{line}</p> : <br key={i} />
  })
}
