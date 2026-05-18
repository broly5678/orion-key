import React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Toaster } from "sonner"
import { AppProviders } from "@/lib/context"
import { ThemeScript } from "./theme-script"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { LOCALE_COOKIE_NAME } from "@/lib/locale-detect"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: {
    template: "%s | FK Shop",
    default: "FK Shop - Digital Delivery",
  },
  description: "Digital goods ordering and automated delivery platform",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "FK Shop",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  const locale = ["zh", "en", "ja", "ko", "es", "fr", "de"].includes(rawLocale ?? "") ? rawLocale! : "zh"

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AppProviders>
          <DynamicFavicon />
          {children}
          <Toaster position="top-center" richColors closeButton />
        </AppProviders>
      </body>
    </html>
  )
}
