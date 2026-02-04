"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui"

interface Resource {
  id: string
  title: string
  description: string
  type: string
  category: string
  url?: string
}

interface ResourcesCardProps {
  resources: Resource[]
  title?: string
}

export function ResourcesCard({ resources, title = "Hulp & Informatie" }: ResourcesCardProps) {
  const typeIcons: Record<string, string> = {
    ARTICLE: "📄",
    LOCAL_SERVICE: "📍",
    NATIONAL_SERVICE: "🏛️",
    TIP: "💡",
    VIDEO: "🎬",
    TOOL: "🔧",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Link href="/hulp">
            <Button variant="ghost" size="sm">
              Meer bekijken
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resources.slice(0, 3).map((resource) => (
            <a
              key={resource.id}
              href={resource.url || `/hulp/${resource.id}`}
              className="block p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group"
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl">{typeIcons[resource.type] || "📌"}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-teal-700">
                    {resource.title}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {resource.description}
                  </p>
                  <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {resource.category}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
