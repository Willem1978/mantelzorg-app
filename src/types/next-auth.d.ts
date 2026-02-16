import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      caregiverId: string | null
      gemeenteNaam: string | null
      gemeenteRollen: string[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    caregiverId: string | null
    gemeenteNaam: string | null
    gemeenteRollen: string[]
  }
}
