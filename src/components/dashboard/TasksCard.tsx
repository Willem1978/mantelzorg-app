"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  category: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: string
  status: "TODO" | "IN_PROGRESS" | "COMPLETED"
}

interface TasksCardProps {
  tasks: Task[]
}

export function TasksCard({ tasks }: TasksCardProps) {
  const priorityColors = {
    LOW: "bg-secondary text-foreground border border-border",
    MEDIUM: "bg-accent-amber-bg text-accent-amber border border-accent-amber",
    HIGH: "bg-accent-red-bg text-accent-red border border-accent-red",
  }

  const categoryIcons: Record<string, string> = {
    SELF_CARE: "🧘",
    ADMINISTRATION: "📋",
    APPOINTMENTS: "📅",
    SOCIAL: "👥",
    HEALTH: "❤️",
    OTHER: "📌",
  }

  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED").slice(0, 4)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mijn Taken</CardTitle>
          <Link href="/taken">
            <Button variant="ghost" size="sm">
              Bekijk alles
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activeTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-base">Geen openstaande taken</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-muted transition-colors border border-border min-h-[48px]"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{categoryIcons[task.category] || "📌"}</span>
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-sm text-muted-foreground">Deadline: {task.dueDate}</p>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-semibold",
                  priorityColors[task.priority]
                )}>
                  {task.priority === "HIGH" && "Hoog"}
                  {task.priority === "MEDIUM" && "Gemiddeld"}
                  {task.priority === "LOW" && "Laag"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
