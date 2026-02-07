import { Navbar } from "@/components/layout/Navbar"
import { MobileNav } from "@/components/navigation/MobileNav"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { SessionValidator } from "@/components/SessionValidator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Valideert sessie periodiek en logt uit bij inloggen op ander apparaat */}
        <SessionValidator />
        <Navbar userRole="CAREGIVER" userName="Jan" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </ThemeProvider>
  )
}
