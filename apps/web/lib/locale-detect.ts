export const LOCALE_COOKIE_NAME = "locale"

export type ResolvedLocale = "zh" | "en" | "ja" | "ko" | "es" | "fr" | "de"

const COUNTRY_LOCALE_MAP: Record<string, ResolvedLocale> = {
  CN: "zh",
  HK: "zh",
  MO: "zh",
  TW: "zh",
  JP: "ja",
  KR: "ko",
  ES: "es",
  MX: "es",
  AR: "es",
  CL: "es",
  CO: "es",
  PE: "es",
  FR: "fr",
  BE: "fr",
  DE: "de",
  AT: "de",
  CH: "de",
}

function normalizeLocale(value?: string | null): ResolvedLocale | null {
  if (!value) return null
  const lower = value.toLowerCase()
  if (lower.startsWith("zh")) return "zh"
  if (lower.startsWith("en")) return "en"
  if (lower.startsWith("ja")) return "ja"
  if (lower.startsWith("ko")) return "ko"
  if (lower.startsWith("es")) return "es"
  if (lower.startsWith("fr")) return "fr"
  if (lower.startsWith("de")) return "de"
  return null
}

export function getLocaleFromCookieString(cookieString?: string | null): ResolvedLocale | null {
  if (!cookieString) return null
  const cookies = cookieString.split(";")
  for (const cookie of cookies) {
    const [rawKey, ...rest] = cookie.trim().split("=")
    if (rawKey !== LOCALE_COOKIE_NAME) continue
    return normalizeLocale(rest.join("="))
  }
  return null
}

export function detectLocaleFromHeaders(input: {
  cookie?: string | null
  country?: string | null
  acceptLanguage?: string | null
}): ResolvedLocale {
  const fromCookie = getLocaleFromCookieString(input.cookie)
  if (fromCookie) return fromCookie

  const country = input.country?.toUpperCase()
  if (country && COUNTRY_LOCALE_MAP[country]) {
    return COUNTRY_LOCALE_MAP[country]
  }

  const preferredLanguages = (input.acceptLanguage ?? "")
    .split(",")
    .map((part) => normalizeLocale(part.split(";")[0]?.trim()))
    .filter(Boolean) as ResolvedLocale[]

  if (preferredLanguages.includes("zh")) return "zh"
  if (preferredLanguages.includes("en")) return "en"
  if (preferredLanguages.includes("ja")) return "ja"
  if (preferredLanguages.includes("ko")) return "ko"
  if (preferredLanguages.includes("es")) return "es"
  if (preferredLanguages.includes("fr")) return "fr"
  if (preferredLanguages.includes("de")) return "de"

  return country && COUNTRY_LOCALE_MAP[country] ? COUNTRY_LOCALE_MAP[country] : "en"
}
