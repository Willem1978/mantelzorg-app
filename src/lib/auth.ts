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
        console.log("Login attempt - phoneNumber:", credentials.phoneNumber, "caregiver:", user.caregiver?.id)
        if (credentials.phoneNumber && user.caregiver) {
          try {
            console.log("Linking phone number:", credentials.phoneNumber, "to caregiver:", user.caregiver.id)
            await prisma.caregiver.update({
              where: { id: user.caregiver.id },
              data: { phoneNumber: credentials.phoneNumber as string },
            })
            console.log("Phone number linked successfully")
          } catch (error) {
            console.error("Failed to link phone number:", error)
          }
        } else {
          console.log("Not linking - phoneNumber:", !!credentials.phoneNumber, "caregiver:", !!user.caregiver)
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
          sessionVersion: updatedUser.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role
        token.caregiverId = (user as any).caregiverId
        token.sessionVersion = (user as any).sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.caregiverId = token.caregiverId as string | null
        ;(session.user as any).sessionVersion = token.sessionVersion as number
      }
      return session
    },
  },
})
