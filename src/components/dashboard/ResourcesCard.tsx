"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui"
import { ensureAbsoluteUrl } from "@/lib/utils"

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
              href={resource.url ? ensureAbsoluteUrl(resource.url) : `/hulp/${resource.id}`}
              className="block p-4 bg-secondary rounded-xl hover:bg-primary-light transition-colors group border border-border min-h-[48px]"
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl">{typeIcons[resource.type] || "📌"}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground group-hover:text-primary">
                    {resource.title}
                  </p>
                  <p className="text-base text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                  <span className="inline-block mt-2 text-sm bg-muted text-muted-foreground px-3 py-0.5 rounded-full border border-border">
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
