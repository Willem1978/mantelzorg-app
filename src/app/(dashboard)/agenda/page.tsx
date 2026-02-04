"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent } from "@/components/ui"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: string
  endTime?: string
  isAllDay: boolean
  eventType: string
  color?: string
}

// B1 taalgebruik - korte, simpele woorden
const eventTypes = [
  { value: "CARE_TASK", label: "Zorg", icon: "🏥", color: "#ef4444", hint: "Voor de zorg" },
  { value: "APPOINTMENT", label: "Afspraak", icon: "📅", color: "#3b82f6", hint: "Arts of andere afspraak" },
  { value: "SELF_CARE", label: "Voor mij", icon: "🧘", color: "#10b981", hint: "Tijd voor jezelf" },
  { value: "SOCIAL", label: "Samen", icon: "👥", color: "#8b5cf6", hint: "Met vrienden of familie" },
  { value: "WORK", label: "Werk", icon: "💼", color: "#f59e0b", hint: "Werk of studie" },
  { value: "OTHER", label: "Anders", icon: "📝", color: "#6b7280", hint: "Iets anders" },
]

const reminderOptions = [
  { value: 0, label: "Geen" },
  { value: 15, label: "15 min van tevoren" },
  { value: 30, label: "30 min van tevoren" },
  { value: 60, label: "1 uur van tevoren" },
  { value: 1440, label: "1 dag van tevoren" },
]

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month">("week")

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventType, setEventType] = useState("OTHER")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isAllDay, setIsAllDay] = useState(false)
  const [reminder, setReminder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [selectedDate])

  const fetchEvents = async () => {
    try {
      const start = new Date(selectedDate)
      start.setDate(start.getDate() - 7)
      const end = new Date(selectedDate)
      end.setDate(end.getDate() + 30)

      const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const startDateTime = isAllDay
        ? new Date(startDate).toISOString()
        : new Date(`${startDate}T${startTime}`).toISOString()

      const endDateTime = endTime && !isAllDay
        ? new Date(`${startDate}T${endTime}`).toISOString()
        : null

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          eventType,
          startTime: startDateTime,
          endTime: endDateTime,
          isAllDay,
          reminderMinutes: reminder || null,
          color: eventTypes.find(t => t.value === eventType)?.color,
        }),
      })

      if (res.ok) {
        resetForm()
        setShowForm(false)
        fetchEvents()
      }
    } catch (error) {
      console.error("Failed to create event:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setLocation("")
    setEventType("OTHER")
    setStartDate("")
    setStartTime("")
    setEndTime("")
    setIsAllDay(false)
    setReminder(0)
  }

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[5]
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.startTime).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  // Get next 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* Header - B1 taalgebruik */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mijn Agenda</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Hier zie je wat je moet doen.
          </p>
        </div>
        <Button
          onClick={() => {
            setStartDate(new Date().toISOString().split("T")[0])
            setShowForm(true)
          }}
          size="lg"
          className="w-full sm:w-auto"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Iets toevoegen
        </Button>
      </div>

      {/* Quick date navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {weekDays.map((date) => {
          const isToday = date.toDateString() === new Date().toDateString()
          const hasEvents = groupedEvents[date.toDateString()]?.length > 0

          return (
            <button
              key={date.toDateString()}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all",
                isToday
                  ? "bg-primary text-primary-foreground"
                  : selectedDate.toDateString() === date.toDateString()
                  ? "bg-secondary"
                  : "hover:bg-secondary/50"
              )}
            >
              <p className="text-xs uppercase opacity-70">
                {date.toLocaleDateString("nl-NL", { weekday: "short" })}
              </p>
              <p className="text-lg font-bold">{date.getDate()}</p>
              {hasEvents && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Nieuw formulier - B1 taalgebruik, fullscreen op mobiel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <Card className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-slide-up">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Header met sluiten knop */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground">Nieuw in agenda</h3>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false) }}
                    className="p-2 hover:bg-secondary rounded-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Stap 1: Waar gaat het over */}
                <div>
                  <label className="block text-base font-medium text-foreground mb-3">
                    1. Waar gaat het over?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {eventTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEventType(type.value)}
                        className={cn(
                          "p-3 sm:p-4 rounded-xl border-2 transition-all text-center",
                          eventType === type.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-2xl sm:text-3xl block">{type.icon}</span>
                        <p className="text-sm font-medium mt-1 text-foreground">{type.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{type.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stap 2: Wat */}
                <div>
                  <label className="block text-base font-medium text-foreground mb-2">
                    2. Wat moet je doen?
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bijvoorbeeld: Naar de dokter"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                {/* Stap 3: Wanneer */}
                <div>
                  <label className="block text-base font-medium text-foreground mb-2">
                    3. Wanneer?
                  </label>

                  {/* Hele dag toggle - eerst tonen */}
                  <label className="flex items-center gap-3 cursor-pointer mb-3 p-3 bg-secondary/50 rounded-xl">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="w-5 h-5 rounded border-input text-primary focus:ring-ring"
                    />
                    <span className="text-foreground">De hele dag</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Datum</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                    {!isAllDay && (
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Van - tot</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="flex-1 px-3 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring"
                            required={!isAllDay}
                          />
                          <span className="text-muted-foreground">-</span>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="flex-1 px-3 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stap 4: Extra (optioneel) */}
                <div className="space-y-3">
                  <p className="text-base font-medium text-foreground">4. Extra (niet verplicht)</p>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Waar?</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Bijvoorbeeld: Bij de huisarts"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Notitie</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Wat moet je niet vergeten?"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Herinnering</label>
                    <select
                      value={reminder}
                      onChange={(e) => setReminder(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {reminderOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Knoppen */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { resetForm(); setShowForm(false) }}
                    className="flex-1"
                    size="lg"
                  >
                    Stop
                  </Button>
                  <Button
                    type="submit"
                    disabled={!title || !startDate || (!isAllDay && !startTime) || isSubmitting}
                    isLoading={isSubmitting}
                    className="flex-1"
                    size="lg"
                  >
                    Opslaan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lijst met items - B1 taalgebruik */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Even laden...
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-10 sm:py-12 text-center px-4">
            <span className="text-5xl sm:text-6xl mb-4 block">📅</span>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Je agenda is leeg
            </h3>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Voeg toe wat je moet doen.
            </p>
            <Button
              size="lg"
              onClick={() => {
                setStartDate(new Date().toISOString().split("T")[0])
                setShowForm(true)
              }}
            >
              Iets toevoegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, dayEvents]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {formatDate(dayEvents[0].startTime)}
                </h3>
                <div className="space-y-2">
                  {dayEvents.map((event) => {
                    const typeInfo = getEventTypeInfo(event.eventType)
                    return (
                      <Card key={event.id} className="overflow-hidden">
                        <div
                          className="h-1"
                          style={{ backgroundColor: event.color || typeInfo.color }}
                        />
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="text-2xl">{typeInfo.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                {event.isAllDay ? (
                                  <span>Hele dag</span>
                                ) : (
                                  <span>
                                    {formatTime(event.startTime)}
                                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                                  </span>
                                )}
                                {event.location && (
                                  <>
                                    <span>•</span>
                                    <span>{event.location}</span>
                                  </>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
