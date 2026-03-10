import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Don't use adapter with credentials provider + JWT
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phoneNumber: { label: "Phone", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[AUTH] Geen email of wachtwoord meegegeven")
          throw new Error("Email en wachtwoord zijn verplicht")
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
            include: {
              caregiver: true,
              mantelBuddy: true,
            },
          })

          if (!user || !user.password) {
            console.error("[AUTH] Gebruiker niet gevonden of geen wachtwoord:", credentials.email)
            throw new Error("Onjuist e-mailadres of wachtwoord")
          }

          if (!user.isActive) {
            console.error("[AUTH] Inactief account login poging:", credentials.email)
            throw new Error("Account is niet actief")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            console.error("[AUTH] Wachtwoord onjuist voor:", credentials.email)
            throw new Error("Onjuist e-mailadres of wachtwoord")
          }

          // Koppel WhatsApp telefoonnummer aan Caregiver profiel als meegegeven
          // Let op: phoneNumber kan "undefined" string zijn door NextAuth serialisatie
          const phoneNumber = credentials.phoneNumber as string | undefined
          const hasValidPhone = phoneNumber &&
            phoneNumber !== "undefined" &&
            phoneNumber !== "null" &&
            phoneNumber.trim() !== "" &&
            phoneNumber.startsWith("+31")

          if (hasValidPhone && user.caregiver) {
            try {
              await prisma.caregiver.update({
                where: { id: user.caregiver.id },
                data: { phoneNumber: phoneNumber },
              })
            } catch (error) {
              console.error("Failed to link phone number:", error)
            }
          }

          // Incrementeer sessionVersion om oude sessies te invalideren (single-session login)
          // Dit zorgt ervoor dat bij een nieuwe login, alle andere browser sessies uitgelogd worden
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { sessionVersion: { increment: 1 } },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            caregiverId: user.caregiver?.id || null,
            buddyId: user.mantelBuddy?.id || null,
            gemeenteNaam: user.gemeenteNaam || null,
            gemeenteRollen: user.gemeenteRollen || [],
            sessionVersion: updatedUser.sessionVersion,
          }
        } catch (error) {
          // Gooi auth-fouten direct door (onjuiste credentials)
          if (error instanceof Error && (
            error.message.includes("Onjuist") ||
            error.message.includes("verplicht") ||
            error.message.includes("niet actief")
          )) {
            throw error
          }
          // Database/connectie fouten: log en geef duidelijke melding
          console.error("[AUTH] Database/connectie fout:", error)
          throw new Error("Kan niet inloggen door een serverfout. Probeer het later opnieuw.")
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = user.role
        token.caregiverId = user.caregiverId
        token.buddyId = user.buddyId
        token.gemeenteNaam = user.gemeenteNaam
        token.gemeenteRollen = user.gemeenteRollen || []
        token.sessionVersion = user.sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.caregiverId = token.caregiverId as string | null
        session.user.buddyId = token.buddyId as string | null
        session.user.gemeenteNaam = token.gemeenteNaam as string | null
        session.user.gemeenteRollen = (token.gemeenteRollen as string[]) || []
        session.user.sessionVersion = token.sessionVersion as number
      }
      return session
    },
  },
})
