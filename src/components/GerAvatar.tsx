"use client"

import { cn } from "@/lib/utils"

interface GerAvatarProps {
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
  animate?: boolean
  typing?: boolean
}

export function GerAvatar({ size = "md", className, animate = false, typing = false }: GerAvatarProps) {
  const sizeClasses = {
    xs: "w-7 h-7",
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
  }

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {/* Avatar cirkel met Ger */}
      <div
        className={cn(
          "rounded-full overflow-hidden bg-gradient-to-b from-[#E8D5B7] to-[#D4C4A8] flex items-end justify-center",
          sizeClasses[size],
          animate && "animate-[ger-bounce_2s_ease-in-out_infinite]",
        )}
        style={animate ? {
          animation: "ger-bounce 2s ease-in-out infinite",
        } : undefined}
      >
        {/* Simpele Ger illustratie */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Achtergrond */}
          <circle cx="50" cy="50" r="50" fill="#E8D5B7" />

          {/* Haar */}
          <ellipse cx="50" cy="35" rx="28" ry="22" fill="#2D5A4A" />
          <ellipse cx="30" cy="40" rx="12" ry="18" fill="#2D5A4A" />
          <ellipse cx="70" cy="40" rx="12" ry="18" fill="#2D5A4A" />

          {/* Gezicht */}
          <ellipse cx="50" cy="50" rx="22" ry="25" fill="#F5D0C5" />

          {/* Bril */}
          <circle cx="40" cy="48" r="8" fill="none" stroke="#4A3728" strokeWidth="2" />
          <circle cx="60" cy="48" r="8" fill="none" stroke="#4A3728" strokeWidth="2" />
          <line x1="48" y1="48" x2="52" y2="48" stroke="#4A3728" strokeWidth="2" />

          {/* Ogen */}
          <circle cx="40" cy="48" r="3" fill="#4A3728" />
          <circle cx="60" cy="48" r="3" fill="#4A3728" />
          <circle cx="41" cy="47" r="1" fill="white" />
          <circle cx="61" cy="47" r="1" fill="white" />

          {/* Glimlach */}
          <path d="M 40 60 Q 50 68 60 60" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />

          {/* Groene polo */}
          <path d="M 25 85 Q 25 70 50 70 Q 75 70 75 85 L 75 100 L 25 100 Z" fill="#2D7A5A" />

          {/* Naamplaatje */}
          <rect x="55" y="78" width="15" height="8" rx="1" fill="#E53935" />
          <text x="62.5" y="84" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">Ger</text>
        </svg>
      </div>

      {/* Typindicator */}
      {typing && (
        <div className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full px-2 py-1 flex items-center gap-0.5 shadow-sm">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0s" }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0.2s" }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0.4s" }} />
        </div>
      )}

      {/* Online indicator */}
      {!typing && animate && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[var(--accent-green)] rounded-full border-2 border-card" />
      )}

      <style jsx>{`
        @keyframes ger-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
