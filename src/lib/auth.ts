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
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
          include: {
            caregiver: true,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
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
          gemeenteNaam: user.gemeenteNaam || null,
          gemeenteRollen: user.gemeenteRollen || [],
          sessionVersion: updatedUser.sessionVersion,
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
        token.gemeenteNaam = user.gemeenteNaam
        token.gemeenteRollen = user.gemeenteRollen || []
        token.sessionVersion = user.sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.caregiverId = token.caregiverId
        session.user.gemeenteNaam = token.gemeenteNaam
        session.user.gemeenteRollen = token.gemeenteRollen || []
        session.user.sessionVersion = token.sessionVersion
      }
      return session
    },
  },
})
