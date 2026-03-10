"use client"

import Link from "next/link"
import { Button } from "@/components/ui"

interface CheckInReminderProps {
  daysUntilCheckIn: number
  isOverdue?: boolean
}

export function CheckInReminder({ daysUntilCheckIn, isOverdue = false }: CheckInReminderProps) {
  if (daysUntilCheckIn > 7 && !isOverdue) {
    return null
  }

  return (
    <div className={`rounded-xl p-6 ${isOverdue ? 'bg-accent-amber-bg border-2 border-accent-amber' : 'bg-primary-light border border-primary/20'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOverdue ? 'bg-accent-amber-bg' : 'bg-primary/10'}`}>
            <svg
              className={`w-6 h-6 ${isOverdue ? 'text-accent-amber' : 'text-primary'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold text-base ${isOverdue ? 'text-foreground' : 'text-foreground'}`}>
              {isOverdue ? 'Maandelijkse check-in is verlopen' : 'Tijd voor je maandelijkse check-in'}
            </h3>
            <p className={`text-base ${isOverdue ? 'text-accent-amber' : 'text-primary'}`}>
              {isOverdue
                ? 'Neem even de tijd om te reflecteren op de afgelopen maand'
                : `Nog ${daysUntilCheckIn} dagen tot je volgende check-in`
              }
            </p>
          </div>
        </div>
        <Link href="/check-in">
          <Button variant={isOverdue ? "secondary" : "primary"}>
            Start check-in
          </Button>
        </Link>
      </div>
    </div>
  )
}
