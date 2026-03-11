"use client"

import DOMPurify from "isomorphic-dompurify"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { parseHulpkaarten, HulpKaart } from "@/components/ai/HulpKaart"
import Link from "next/link"

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

  if (ctx.hasTest) {
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

    if (ctx.trend === "improved" || ctx.wellbeingTrend === "up") {
      actions.push({ label: "Hoe houd ik dit vast?", emoji: "🌱", action: "vraag", color: "green" })
    } else {
      actions.push({ label: "Welke hulp is er voor mij?", emoji: "🙋", action: "vraag", color: "sky" })
    }

    if (ctx.zwareTaakNaam) {
      actions.push({ label: `Hulp bij ${ctx.zwareTaakNaam}`, emoji: "🏘️", action: "vraag", color: "amber" })
    } else {
      actions.push({ label: "Welke hulp is er voor mijn naaste?", emoji: "🏘️", action: "vraag", color: "amber" })
    }
    return actions
  }

  if (ctx.hasProfile) {
    actions.push({ label: "Start de balanstest", emoji: "📊", action: "/belastbaarheidstest", color: "purple" })
    actions.push({ label: "Wat is de balanstest?", emoji: "❓", action: "vraag", color: "sky" })
    actions.push({ label: "Geef me een tip", emoji: "💡", action: "vraag", color: "amber" })
    return actions
  }

  actions.push({ label: "Wat kan ik hier doen?", emoji: "💡", action: "vraag", color: "amber" })
  actions.push({ label: "Maak mijn profiel aan", emoji: "👤", action: "/profiel", color: "sky" })
  actions.push({ label: "Start de balanstest", emoji: "📊", action: "/belastbaarheidstest", color: "purple" })
  return actions
}

function buildGreetingMessage(ctx: GerChatContext): string {
  const naam = ctx.userName || "daar"

  if (ctx.hasTest) {
    if (ctx.trend === "worse" || ctx.wellbeingTrend === "down") {
      return `Hey ${naam}, fijn dat je er bent. Ik ben er voor je. Wat houdt je bezig?`
    }
    if (ctx.trend === "improved" || ctx.wellbeingTrend === "up") {
      return `Hey ${naam}, goed je te zien! Het gaat de goede kant op. Wat kan ik voor je doen?`
    }
    if (ctx.overdueTasks && ctx.overdueTasks > 0) {
      return `Hey ${naam}, fijn dat je er weer bent! Er staan nog een paar dingen open. Waar wil je mee beginnen?`
    }
    if (ctx.needsNewTest && ctx.daysSinceTest && ctx.daysSinceTest > 30) {
      return `Hey ${naam}, leuk je weer te zien! Het is even geleden. Hoe gaat het met je?`
    }
    if (ctx.niveau === "HOOG") {
      return `Hey ${naam}, goed dat je er bent. Ik ben er voor je. Vertel, wat speelt er?`
    }
    if (ctx.zwareTaakNaam) {
      return `Hey ${naam}! Vorige keer hadden we het over ${ctx.zwareTaakNaam}. Hoe gaat het daarmee?`
    }
    return `Hey ${naam}, fijn dat je er weer bent! Waar kan ik je mee helpen?`
  }

  if (ctx.hasProfile) {
    return `Hey ${naam}, welkom terug! Wil je de balanstest doen? Dan kan ik je veel gerichter helpen.`
  }

  return `Hey ${naam}! Welkom bij MantelBuddy. Ik ben Ger, je persoonlijke coach. Vertel, wat wil je weten?`
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

  // Chip kleuren voor suggesties
  const chipColorMap: Record<string, string> = {
    amber: "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/60",
    rose: "bg-rose-100 border-rose-300 text-rose-900 hover:bg-rose-200 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/60",
    sky: "bg-sky-100 border-sky-300 text-sky-900 hover:bg-sky-200 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-200 dark:hover:bg-sky-900/60",
    purple: "bg-purple-100 border-purple-300 text-purple-900 hover:bg-purple-200 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200 dark:hover:bg-purple-900/60",
    blue: "bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900/60",
    green: "bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/60",
  }

  return (
    <div className="ker-card flex flex-col relative" style={{ minHeight: "320px" }}>
      {/* Chat berichten container — scrollable area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-3 pb-3"
        style={{ maxHeight: hasMessages ? "50vh" : undefined }}
      >
        {/* Ger begroeting — links met avatar */}
        <div className="flex items-start gap-2.5">
          <GerAvatar size="sm" className="!w-9 !h-9 mt-0.5 flex-shrink-0" animate />
          <div className="max-w-[85%]">
            <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-medium">
                {formatMessage(greetingMessage)}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestie-chips — direct onder begroeting, links uitgelijnd */}
        {!hasMessages && proactiveActions.length > 0 && (
          <div className="pl-[2.875rem] flex flex-col gap-2">
            {/* Primaire actie — groter en krachtiger */}
            <button
              onClick={() => {
                const action = proactiveActions[0]
                if (action.action.startsWith("/")) {
                  router.push(action.action)
                } else {
                  handleSend(action.label)
                }
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all w-fit",
                "shadow-sm hover:shadow-md active:scale-[0.97]",
                chipColorMap[proactiveActions[0].color] || chipColorMap.amber
              )}
            >
              <span className="text-lg leading-none">{proactiveActions[0].emoji}</span>
              <span>{proactiveActions[0].label}</span>
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* Secundaire acties — compacter */}
            <div className="flex flex-wrap gap-2">
              {proactiveActions.slice(1).map((action, i) => (
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
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all",
                    "shadow-sm hover:shadow active:scale-[0.97]",
                    chipColorMap[action.color] || chipColorMap.amber
                  )}
                >
                  <span className="text-base leading-none">{action.emoji}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat berichten — WhatsApp/iMessage flow */}
        {hasMessages && messages.map((message) => {
          const rawText = getMessageText(message)
          if (!rawText) return null

          const isUser = message.role === "user"
          const isAssistant = message.role === "assistant"
          const { cleanText: textWithoutCards, kaarten } = isAssistant
            ? parseHulpkaarten(rawText)
            : { cleanText: rawText, kaarten: [] }
          const { cleanText, buttons } = isAssistant
            ? parseButtons(textWithoutCards)
            : { cleanText: textWithoutCards, buttons: [] }

          const hasExtras = isAssistant && (kaarten.length > 0 || buttons.length > 0)
          return (
            <div key={message.id}>
              {/* Bericht bubble */}
              <div className={cn("flex items-end gap-2.5", isUser && "flex-row-reverse")}>
                {/* Avatar — alleen voor assistant */}
                {isAssistant && (
                  <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mb-0.5" />
                )}

                <div className={cn("max-w-[80%]", isUser && "max-w-[75%]")}>
                  {isUser ? (
                    cleanText && (
                      <div className="rounded-2xl px-3.5 py-2.5 bg-primary text-primary-foreground rounded-br-sm">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground">
                          {formatMessage(cleanText)}
                        </div>
                      </div>
                    )
                  ) : (
                    /* Ger bubble: tekst + hulpkaarten + knoppen in één geheel */
                    <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm overflow-hidden">
                      {cleanText && (
                        <div className="px-3.5 py-2.5">
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                            {formatMessage(cleanText)}
                          </div>
                        </div>
                      )}

                      {hasExtras && (
                        <div className={cn("px-3 pb-2.5 flex flex-col gap-1.5", cleanText && "pt-0")}>
                          {/* Hulpkaarten — compact, in de bubble */}
                          {kaarten.slice(0, 2).map((kaart, i) => (
                            <HulpKaart key={`h-${i}`} kaart={kaart} />
                          ))}

                          {/* Vraag/actie chips — horizontal in de bubble */}
                          {buttons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {buttons.slice(0, 3).map((btn, i) => (
                                <button
                                  key={`b-${i}`}
                                  onClick={() => handleButtonClick(btn)}
                                  disabled={showTypingIndicator}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                    "bg-white/60 dark:bg-card/60 border border-primary/15 text-foreground",
                                    "hover:bg-white dark:hover:bg-card hover:border-primary/30",
                                    showTypingIndicator && "opacity-50 cursor-not-allowed"
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
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {showTypingIndicator && (
          <div className="flex items-end gap-2.5">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mb-0.5" />
            <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted-foreground">Ger typt...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="pl-[2.625rem]">
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
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Tekst-invoer — vast onderaan de chat-container */}
      <div className="border-t border-border/60 pt-3 mt-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type jouw vraag hier..."
            className="flex-1 bg-[var(--secondary)] rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        {/* Link naar volledig gesprek */}
        {hasMessages && (
          <div className="text-center mt-2">
            <Link href="/ai-assistent" className="text-xs text-primary hover:underline">
              Ga naar volledig gesprek met Ger
            </Link>
          </div>
        )}
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
          <span className="text-primary">&bull;</span>
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
