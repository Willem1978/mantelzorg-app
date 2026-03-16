import { handlers } from "@/lib/auth"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// NextAuth v5 route handlers — direct export zonder wrapper
// De handlers moeten direct geëxporteerd worden zodat NextAuth
// de volledige controle heeft over request/response afhandeling.
export const { GET, POST } = handlers
