import { ThemeProvider } from "@/contexts/ThemeContext"
import { DashboardShell } from "@/components/layout/DashboardShell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </ThemeProvider>
  )
}
