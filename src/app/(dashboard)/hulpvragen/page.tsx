"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { cn } from "@/lib/utils"

interface HelpRequest {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  status: string
  createdAt: string
  response?: string
  respondedAt?: string
  organisation?: { name: string }
}

// B1 taalgebruik - korte, duidelijke woorden
const categories = [
  { value: "RESPITE_CARE", label: "Even vrij", icon: "🏠", hint: "Iemand neemt de zorg over" },
  { value: "EMOTIONAL_SUPPORT", label: "Praten", icon: "💚", hint: "Over je gevoel praten" },
  { value: "PRACTICAL_HELP", label: "Hulp thuis", icon: "🔧", hint: "Klussen of taken" },
  { value: "FINANCIAL_ADVICE", label: "Geld", icon: "💰", hint: "Hulp met geld of aanvragen" },
  { value: "INFORMATION", label: "Info", icon: "ℹ️", hint: "Informatie zoeken" },
  { value: "OTHER", label: "Anders", icon: "📝", hint: "Iets anders" },
]

const urgencies = [
  { value: "LOW", label: "Kan wachten", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  { value: "NORMAL", label: "Deze week", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "HIGH", label: "Snel graag", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  { value: "URGENT", label: "Nu!", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
]

const statuses: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Nieuw", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  IN_PROGRESS: { label: "Bezig", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  RESPONDED: { label: "Antwoord", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  RESOLVED: { label: "Klaar", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  CLOSED: { label: "Gesloten", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
}

export default function HulpvragenPage() {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [urgency, setUrgency] = useState("NORMAL")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchHelpRequests()
  }, [])

  const fetchHelpRequests = async () => {
    try {
      const res = await fetch("/api/help-requests")
      if (res.ok) {
        const data = await res.json()
        setHelpRequests(data.helpRequests || [])
      }
    } catch (error) {
      console.error("Failed to fetch help requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, urgency }),
      })

      if (res.ok) {
        setTitle("")
        setDescription("")
        setCategory("")
        setUrgency("NORMAL")
        setShowForm(false)
        fetchHelpRequests()
      }
    } catch (error) {
      console.error("Failed to create help request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryInfo = (cat: string) => {
    return categories.find(c => c.value === cat) || { label: cat, icon: "📝", hint: "" }
  }

  const getUrgencyInfo = (urg: string) => {
    return urgencies.find(u => u.value === urg) || urgencies[1]
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* Header - simpel en duidelijk */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Hulp vragen</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Heb je hulp nodig? Stel hier je vraag.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto"
          size="lg"
        >
          <span className="text-xl mr-2">+</span>
          Vraag stellen
        </Button>
      </div>

      {/* Formulier - grote knoppen, duidelijke stappen */}
      {showForm && (
        <Card className="animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Nieuwe vraag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Stap 1: Waar gaat het over? */}
              <div>
                <label className="block text-base font-medium text-foreground mb-3">
                  1. Waar gaat je vraag over?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-center",
                        category === cat.value
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50 bg-card"
                      )}
                    >
                      <span className="text-3xl block mb-1">{cat.icon}</span>
                      <p className="font-semibold text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cat.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stap 2: Wat is je vraag? */}
              <div>
                <label className="block text-base font-medium text-foreground mb-2">
                  2. Wat is je vraag?
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv: Ik zoek iemand die kan helpen"
                  className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                  required
                />
              </div>

              {/* Stap 3: Vertel meer */}
              <div>
                <label className="block text-base font-medium text-foreground mb-2">
                  3. Vertel meer
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vertel wat je nodig hebt. Hoe meer je vertelt, hoe beter we kunnen helpen."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none"
                  required
                />
              </div>

              {/* Stap 4: Hoe snel? */}
              <div>
                <label className="block text-base font-medium text-foreground mb-3">
                  4. Hoe snel heb je hulp nodig?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {urgencies.map((urg) => (
                    <button
                      key={urg.value}
                      type="button"
                      onClick={() => setUrgency(urg.value)}
                      className={cn(
                        "px-3 py-3 rounded-xl text-sm font-medium transition-all",
                        urgency === urg.value
                          ? urg.color + " ring-2 ring-primary shadow-md"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {urg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Knoppen */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:flex-1 order-2 sm:order-1"
                  size="lg"
                >
                  Terug
                </Button>
                <Button
                  type="submit"
                  disabled={!category || !title || !description || isSubmitting}
                  isLoading={isSubmitting}
                  className="w-full sm:flex-1 order-1 sm:order-2"
                  size="lg"
                >
                  Verstuur vraag
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lijst met vragen */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Even laden...
        </div>
      ) : helpRequests.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-6xl mb-4 block">🤝</span>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nog geen vragen
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Heb je ergens hulp bij nodig? Wij helpen je graag verder.
            </p>
            <Button onClick={() => setShowForm(true)} size="lg">
              Stel je eerste vraag
            </Button>
          </CardContent>
        </Card>
      ) : !showForm && (
        <div className="space-y-3">
          {helpRequests.map((request) => {
            const catInfo = getCategoryInfo(request.category)
            const statusInfo = statuses[request.status] || statuses.OPEN

            return (
              <Card
                key={request.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                onClick={() => setSelectedRequest(request)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl flex-shrink-0">{catInfo.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground text-base sm:text-lg line-clamp-1">
                          {request.title}
                        </h3>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0",
                          statusInfo.color
                        )}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="bg-secondary px-2 py-0.5 rounded">{catInfo.label}</span>
                        <span>•</span>
                        <span>{new Date(request.createdAt).toLocaleDateString("nl-NL")}</span>
                        {request.response && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓ Antwoord
                          </span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail popup - fullscreen op mobiel */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <Card className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-y-auto animate-slide-up rounded-t-3xl sm:rounded-2xl sm:m-4">
            <CardHeader className="sticky top-0 bg-card z-10 flex flex-row items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCategoryInfo(selectedRequest.category).icon}</span>
                <div>
                  <CardTitle className="text-lg">{selectedRequest.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryInfo(selectedRequest.category).label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-secondary rounded-full -mr-2"
                aria-label="Sluiten"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex gap-2 flex-wrap">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  statuses[selectedRequest.status]?.color
                )}>
                  {statuses[selectedRequest.status]?.label}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  getUrgencyInfo(selectedRequest.urgency).color
                )}>
                  {getUrgencyInfo(selectedRequest.urgency).label}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Jouw vraag:</h4>
                <p className="text-foreground whitespace-pre-wrap bg-secondary/50 rounded-xl p-4">
                  {selectedRequest.description}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Verstuurd op {new Date(selectedRequest.createdAt).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>

              {selectedRequest.response && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span>✓</span> Antwoord ontvangen
                  </h4>
                  <p className="text-foreground whitespace-pre-wrap">
                    {selectedRequest.response}
                  </p>
                  {selectedRequest.respondedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(selectedRequest.respondedAt).toLocaleDateString("nl-NL")}
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => setSelectedRequest(null)}
              >
                Sluiten
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
