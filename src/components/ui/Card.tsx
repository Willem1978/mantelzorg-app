import { HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

// Card component met dark mode ondersteuning
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Basis stijlen met dark mode
        "bg-card rounded-2xl shadow-sm border border-border",
        // Responsive padding
        "p-4 sm:p-6",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mb-3 sm:mb-4", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base sm:text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground mt-1", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
