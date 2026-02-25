interface LogoIconProps {
  size?: number
  className?: string
}

export function LogoIcon({ size = 32, className }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* Left figure */}
      <circle cx="16" cy="10" r="6" fill="#2C7A7B"/>
      <path d="M16 16C9 22 5 33 24 46C17 37 12 27 16 16Z" fill="#2C7A7B"/>
      {/* Right figure */}
      <circle cx="32" cy="10" r="6" fill="#319795"/>
      <path d="M32 16C39 22 43 33 24 46C31 37 36 27 32 16Z" fill="#319795"/>
    </svg>
  )
}
