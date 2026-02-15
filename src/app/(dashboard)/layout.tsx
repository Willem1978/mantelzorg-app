import { ThemeProvider } from "@/contexts/ThemeContext"
import { AccessibilityProvider } from "@/contexts/AccessibilityContext"
import { DashboardShell } from "@/components/layout/DashboardShell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <DashboardShell>
          {children}
        </DashboardShell>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}
