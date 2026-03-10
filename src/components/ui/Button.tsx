"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    // Verbeterde toegankelijkheid: grotere touch targets, duidelijke focus states
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"

    // Warme kleurvarianten met hoog contrast
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-[0_2px_8px_rgba(46,107,79,0.2)]",
      secondary: "bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent shadow-[0_2px_8px_rgba(184,86,54,0.2)]",
      outline: "border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary",
      ghost: "text-foreground hover:bg-secondary focus:ring-ring",
      danger: "bg-accent-red text-white hover:bg-accent-red/90 focus:ring-accent-red",
    }

    // Grotere touch targets voor ouderen (min 44px sm, 48px md)
    const sizes = {
      sm: "px-4 py-2.5 text-sm min-h-[44px]",
      md: "px-5 py-3 text-base min-h-[48px]",
      lg: "px-6 py-3.5 text-lg min-h-[56px]",
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Even geduld...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
