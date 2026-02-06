import { NextRequest, NextResponse } from 'next/server'

// Korte redirect URLs voor WhatsApp
// /r/reg -> /register-whatsapp
// /r/log -> /login-whatsapp
// Optioneel met phone: /r/reg?p=+31... -> /register-whatsapp?phone=...

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('p')

  const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'

  // Bouw redirect URL met optionele phone parameter
  const phoneParam = phone ? `?phone=${encodeURIComponent(phone)}` : ''

  switch (code) {
    case 'reg':
      return NextResponse.redirect(`${baseUrl}/register-whatsapp${phoneParam}`)
    case 'log':
      return NextResponse.redirect(`${baseUrl}/login-whatsapp${phoneParam}`)
    default:
      return NextResponse.redirect(baseUrl)
  }
}
