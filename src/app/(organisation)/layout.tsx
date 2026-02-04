import { Navbar } from "@/components/layout/Navbar"

export default function OrganisationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole="ORG_MEMBER" userName="Organisatie Admin" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
