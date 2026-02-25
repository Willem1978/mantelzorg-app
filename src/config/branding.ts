/**
 * Centrale branding configuratie voor MantelBuddy.
 * Wijzig hier de app-naam, contactgegevens, URLs en logo-paden.
 * Alle componenten importeren uit dit bestand.
 */

export const branding = {
  // App identiteit
  appName: "MantelBuddy",
  tagline: "Samen lokaal sterk",
  description: "MantelBuddy verbindt mantelzorgers met vrijwilligers uit de buurt",
  heroTitle: "Samen zorgen, samen sterk",

  // Contact
  contact: {
    email: "info@mantelbuddy.nl",
    mantelzorglijn: "030 - 205 90 59",
    mantelzorglijnTel: "tel:0302059059",
    mantelzorglijnUrl: "https://www.mantelzorg.nl/onderwerpen/ondersteuning/waar-kun-je-terecht/mantelzorglijn",
    whatsappNumber: "+14155238886",
    whatsappLink: "https://wa.me/14155238886?text=Hoi",
  },

  // URLs
  urls: {
    production: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://mantelzorg-app.vercel.app",
    mantelzorgNl: "https://www.mantelzorg.nl",
    mantelzorgSteunpunten: "https://mantelzorg.nl/steunpunten",
  },

  // Logo & assets
  assets: {
    logoIcon: "/logo-icon.svg",
    favicon: "/favicon.ico",
    pwaIcon192: "/icons/icon-192.png",
    pwaIcon512: "/icons/icon-512.png",
  },

  // Logo SVG kleuren (voor LogoIcon component)
  logoColors: {
    left: "#2C7A7B",
    right: "#319795",
  },

  // Thema kleur (voor manifest, viewport, etc.)
  themeColor: "#2C7A7B",
  backgroundColor: "#F7FAFC",

  // Privacy
  privacy: {
    cookieMaxAge: 30 * 24 * 60 * 60, // 30 dagen in seconden
  },
} as const

// Helper: volledige titel voor metadata
export function pageTitle(subtitle?: string): string {
  if (!subtitle) return `${branding.appName} - ${branding.tagline}`
  return `${subtitle} - ${branding.appName}`
}

// Helper: WhatsApp QR code URL
export function whatsappQrUrl(size = 150): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(branding.contact.whatsappLink)}`
}

// Helper: Google zoek URL voor mantelzorgondersteuning in gemeente
export function gemeenteZoekUrl(gemeente: string): string {
  return `https://www.google.com/search?q=mantelzorgondersteuning+${encodeURIComponent(gemeente)}`
}

// Helper: WMO loket zoek URL
export function wmoLoketUrl(gemeente: string): string {
  return `https://www.google.com/search?q=WMO+loket+${encodeURIComponent(gemeente)}`
}
