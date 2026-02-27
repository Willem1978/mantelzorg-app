"use client"

import { AiChat } from "@/components/ai/AiChat"

export default function AiAssistentPage() {
  return (
    <div className="ker-page-content">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Ger - Je assistent</h1>
          <p className="text-sm text-muted-foreground">Stel je vraag over mantelzorg</p>
        </div>
      </div>
      <AiChat />
    </div>
  )
}
