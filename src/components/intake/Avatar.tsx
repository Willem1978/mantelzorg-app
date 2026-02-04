"use client"

// Vriendelijke avatar component (KER-stijl)
interface AvatarProps {
  name?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Avatar({ name = "Mia", size = "md", className = "" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Avatar circle with friendly face */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2" />

        {/* Hair */}
        <ellipse cx="50" cy="30" rx="35" ry="25" fill="#5D4037" />
        <ellipse cx="25" cy="45" rx="8" ry="15" fill="#5D4037" />
        <ellipse cx="75" cy="45" rx="8" ry="15" fill="#5D4037" />

        {/* Face */}
        <ellipse cx="50" cy="55" rx="28" ry="30" fill="#FFCC80" />

        {/* Glasses */}
        <ellipse cx="38" cy="50" rx="10" ry="9" fill="none" stroke="#333" strokeWidth="2" />
        <ellipse cx="62" cy="50" rx="10" ry="9" fill="none" stroke="#333" strokeWidth="2" />
        <line x1="48" y1="50" x2="52" y2="50" stroke="#333" strokeWidth="2" />
        <line x1="28" y1="48" x2="22" y2="45" stroke="#333" strokeWidth="2" />
        <line x1="72" y1="48" x2="78" y2="45" stroke="#333" strokeWidth="2" />

        {/* Eyes */}
        <circle cx="38" cy="50" r="3" fill="#333" />
        <circle cx="62" cy="50" r="3" fill="#333" />
        <circle cx="39" cy="49" r="1" fill="#fff" />
        <circle cx="63" cy="49" r="1" fill="#fff" />

        {/* Smile */}
        <path d="M 38 65 Q 50 75 62 65" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Cheeks */}
        <circle cx="30" cy="60" r="4" fill="#FFAB91" opacity="0.6" />
        <circle cx="70" cy="60" r="4" fill="#FFAB91" opacity="0.6" />

        {/* Shirt collar hint */}
        <path d="M 30 85 Q 50 95 70 85" stroke="#4CAF50" strokeWidth="3" fill="none" />
      </svg>

      {/* Name badge */}
      {name && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {name}
        </div>
      )}
    </div>
  )
}
