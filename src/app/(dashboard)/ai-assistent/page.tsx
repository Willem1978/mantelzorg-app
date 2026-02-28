"use client"

import { AiChat } from "@/components/ai/AiChat"
import { GerAvatar } from "@/components/GerAvatar"

export default function AiAssistentPage() {
  return (
    <div className="ker-page-content">
      <div className="flex items-center gap-3 mb-2">
        <GerAvatar size="sm" className="!w-10 !h-10" animate />
        <div>
          <h1 className="text-xl font-bold text-foreground">Ger - Je assistent</h1>
          <p className="text-sm text-muted-foreground">Stel je vraag over mantelzorg</p>
        </div>
      </div>
      <AiChat />
    </div>
  )
}
