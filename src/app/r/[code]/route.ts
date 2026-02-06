import { NextRequest, NextResponse } from 'next/server'

// Korte redirect URLs voor WhatsApp
// /r/reg?p=+31... -> /register-whatsapp?phone=...
// /r/log?p=+31... -> /login-whatsapp?phone=...

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('p') || ''

  const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'

  switch (code) {
    case 'reg':
      return NextResponse.redirect(`${baseUrl}/register-whatsapp?phone=${encodeURIComponent(phone)}`)
    case 'log':
      return NextResponse.redirect(`${baseUrl}/login-whatsapp?phone=${encodeURIComponent(phone)}`)
    default:
      return NextResponse.redirect(baseUrl)
  }
}
