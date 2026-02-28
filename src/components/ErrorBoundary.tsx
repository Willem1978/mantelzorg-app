"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary component.
 * Vangt onverwachte fouten op in child-componenten.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-3">😵</p>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Oeps, dat lukte niet
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Er ging iets fout. Druk op de knop om het opnieuw te proberen.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="ker-btn ker-btn-primary"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
