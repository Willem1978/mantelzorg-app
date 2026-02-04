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
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-red-100 text-red-700",
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
          <div className="text-center py-8 text-gray-500">
            <p>Geen openstaande taken</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{categoryIcons[task.category] || "📌"}</span>
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-gray-500">Deadline: {task.dueDate}</p>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
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
