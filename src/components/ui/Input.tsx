"use client"

import { InputHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm sm:text-base font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        {hint && (
          <p className="text-sm text-muted-foreground mb-2">{hint}</p>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            // Basis stijlen - grotere touch target (min 44px)
            "w-full px-4 py-3 text-base border rounded-xl transition-all",
            // Focus state - duidelijk zichtbaar
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            // Dark mode ondersteuning
            "bg-background text-foreground placeholder:text-muted-foreground",
            // Border kleur op basis van error state
            error
              ? "border-red-500 dark:border-red-400 focus:ring-red-500"
              : "border-input hover:border-primary/50",
            // Min hoogte voor toegankelijkheid
            "min-h-[48px]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
