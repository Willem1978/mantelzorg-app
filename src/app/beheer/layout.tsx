import Link from "next/link"

export default function BeheerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-foreground">MantelBuddy</span>
          </Link>
          <span className="text-sm text-muted-foreground">Beheeromgeving</span>
        </div>
      </header>
      <main className="py-4 pb-8">
        {children}
      </main>
    </div>
  )
}
