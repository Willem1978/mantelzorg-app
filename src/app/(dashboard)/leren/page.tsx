"use client"

import Link from "next/link"

const categories = [
  {
    id: "praktische-tips",
    title: "Praktische tips",
    description: "Voor het dagelijks leven",
    emoji: "💡",
    href: "/leren/praktische-tips",
  },
  {
    id: "zelfzorg",
    title: "Zelfzorg tips",
    description: "Zorg ook voor jezelf",
    emoji: "🧘",
    href: "/leren/zelfzorg",
  },
  {
    id: "rechten",
    title: "Je rechten",
    description: "Waar heb je recht op?",
    emoji: "⚖️",
    href: "/leren/rechten",
  },
  {
    id: "financieel",
    title: "Financieel",
    description: "Vergoedingen & regelingen",
    emoji: "💰",
    href: "/leren/financieel",
  },
]

export default function LerenPage() {
  return (
    <div className="ker-page-content pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📚</span>
        <h1 className="text-2xl font-bold">Leren & Tips</h1>
      </div>

      {/* Categorieën grid */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="ker-card hover:shadow-md transition-shadow flex flex-col items-start p-5"
          >
            <span className="text-3xl mb-3">{category.emoji}</span>
            <h2 className="font-bold text-lg">{category.title}</h2>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
