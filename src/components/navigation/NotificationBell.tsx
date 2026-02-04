"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CHECK_IN_REMINDER":
        return "📋"
      case "TASK_REMINDER":
        return "✅"
      case "HELP_REQUEST_UPDATE":
        return "💬"
      case "TIP":
        return "💡"
      default:
        return "🔔"
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-secondary transition-colors"
        aria-label="Notificaties"
      >
        <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-emoticon-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown - B1 taalgebruik */}
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg z-50 animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Berichten</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary hover:underline"
                >
                  Alles gelezen
                </button>
              )}
            </div>

            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Even laden...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground">
                  <span className="text-4xl mb-2 block">🔔</span>
                  <p className="text-sm">Geen nieuwe berichten</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.link) {
                        window.location.href = notification.link
                      }
                    }}
                    className={cn(
                      "p-3 sm:p-4 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <span className="text-xl sm:text-2xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm text-foreground",
                          !notification.isRead && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-border">
                <a
                  href="/notificaties"
                  className="block text-center text-sm text-primary hover:underline py-1"
                >
                  Alles bekijken
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
