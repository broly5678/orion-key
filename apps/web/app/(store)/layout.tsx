import React from "react"
import { cookies } from "next/headers"
import type { Locale } from "@/lib/i18n"
import { LOCALE_COOKIE_NAME } from "@/lib/locale-detect"
import { localizeSiteField } from "@/lib/storefront-site-i18n"
import { getSiteConfig } from "@/services/api-server"
import { StoreShell } from "./store-shell"

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = ((cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined) || "zh")
  const config = await getSiteConfig().catch(() => null)
  const siteName = localizeSiteField("site_name", config?.site_name || "FK Shop", locale)

  return (
    <StoreShell siteName={siteName}>
      {children}
    </StoreShell>
  )
}
