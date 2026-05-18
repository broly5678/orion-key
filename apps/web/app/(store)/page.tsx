import { getProducts, getCategories, getSiteConfig } from "@/services/api-server"
import { localizeSiteField } from "@/lib/storefront-site-i18n"
import { LOCALE_COOKIE_NAME } from "@/lib/locale-detect"
import { localizeProductCard } from "@/lib/storefront-product-i18n"
import { HomeContent } from "./home-content"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import type { Locale } from "@/lib/i18n"

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies()
    const locale = ((cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined) || "zh")
    const config = await getSiteConfig()
    const siteName = localizeSiteField("site_name", config.site_name || "FK Shop", locale)
    const siteDescription = localizeSiteField("site_description", config.site_description || config.site_slogan || "", locale)
    return {
      title: siteName,
      description: siteDescription,
      alternates: { canonical: "/" },
      openGraph: {
        title: siteName,
        description: siteDescription,
        url: "/",
        ...(config.logo_url ? { images: [{ url: config.logo_url }] } : {}),
      },
    }
  } catch {
    return {}
  }
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const locale = ((cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined) || "zh")
  const [productsData, categories, config] = await Promise.all([
    getProducts({ page: 1, page_size: 100 }).catch(() => ({ list: [] as never[], pagination: { page: 1, page_size: 100, total: 0 } })),
    getCategories().catch(() => []),
    getSiteConfig().catch(() => null),
  ])
  const localizedProducts = productsData.list.map((product) => localizeProductCard(product, locale))
  const localizedSiteName = localizeSiteField("site_name", config?.site_name || "FK Shop", locale)
  const localizedSiteSlogan = localizeSiteField("site_slogan", config?.site_slogan || "", locale)
  const localizedSiteDescription = localizeSiteField("site_description", config?.site_description || "", locale)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: localizedSiteName,
    description: localizedSiteDescription || localizedSiteSlogan,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent
        products={localizedProducts}
        categories={categories}
        siteSlogan={localizedSiteSlogan}
        siteDescription={localizedSiteDescription}
      />
    </>
  )
}
