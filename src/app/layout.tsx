import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Geist als fallback font via next/font (wordt geladen op Vercel)
// Atkinson Hyperlegible staat als eerste voorkeur in de CSS body font-family
const geistSans = Geist({
  variable: "--font-atkinson",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MantelBuddy - Samen zorgen, samen sterk",
  description: "MantelBuddy verbindt mantelzorgers met vrijwilligers uit de buurt",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MantelBuddy",
  },
};

export const viewport: Viewport = {
  themeColor: "#8B2B6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Atkinson Hyperlegible font voor optimale leesbaarheid voor ouderen */}
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
