import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface User extends DefaultUser {
    role: string
    caregiverId: string | null
    buddyId: string | null
    gemeenteNaam: string | null
    gemeenteRollen: string[]
    sessionVersion: number
  }

  interface Session {
    user: {
      id: string
      role: string
      caregiverId: string | null
      buddyId: string | null
      gemeenteNaam: string | null
      gemeenteRollen: string[]
      sessionVersion: number
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    caregiverId: string | null
    buddyId: string | null
    gemeenteNaam: string | null
    gemeenteRollen: string[]
    sessionVersion: number
  }
}
