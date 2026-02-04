import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/email-verificatie?error=missing_token", request.url))
    }

    // Find token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/email-verificatie?error=invalid_token", request.url))
    }

    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      })
      return NextResponse.redirect(new URL("/email-verificatie?error=expired_token", request.url))
    }

    // Find user and verify
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    })

    if (!user) {
      return NextResponse.redirect(new URL("/email-verificatie?error=user_not_found", request.url))
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token }
    })

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Welkom bij MantelzorgApp!",
        message: "Je e-mail is bevestigd. Start de intake om je persoonlijke dashboard te krijgen.",
        link: "/intake",
      }
    })

    return NextResponse.redirect(new URL("/email-verificatie?success=true", request.url))

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/email-verificatie?error=server_error", request.url))
  }
}
