import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import { branding, pageTitle } from "@/config/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: pageTitle(),
  description: branding.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: branding.appName,
  },
};

export const viewport: Viewport = {
  themeColor: branding.themeColor,
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
        {/* Nunito via Google Fonts CDN - faalt gracefully naar system fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        {/* Skip-to-content link — WCAG 2.1 AA: keyboard users can skip navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
        >
          Direct naar inhoud
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
